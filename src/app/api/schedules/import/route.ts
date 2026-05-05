import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { requireRole } from '@/services/auth.service';
import {
  createSchedule,
  listSchedulesByDay,
} from '@/services/schedule.service';
import { listSubjects } from '@/services/subject.service';
import { listClasses } from '@/services/class.service';
import { resolveClassFromList } from '@/services/resolver';
import {
  detectConflicts,
  type CandidateSchedule,
} from '@/services/scheduling.validator';
import { normalizePersonName } from '@/lib/normalize';
import type { Schedule, DayOfWeek } from '@/features/schedules/types';

interface ImportRow {
  subject_name?: string;
  class_section?: string;
  day_of_week?: string;
  start_time?: string;
  end_time?: string;
  room?: string;
}

interface ImportRequest {
  rows: ImportRow[];
}

/**
 * POST /api/schedules/import
 *
 * CSV format (audit fix #5, #6, #7):
 *   subject_name, class_section, day_of_week, start_time, end_time, room
 *
 * Notes:
 *   - subject_name + class_section is the unique key for a Subject
 *     (replaces the removed subject_code field)
 *   - Schedule's classId and facultyId are derived from the resolved subject
 *   - Each row is conflict-checked against existing DB rows AND against
 *     previously-accepted rows of THIS import (so a CSV can't conflict with
 *     itself)
 *   - Per-row errors are collected and returned alongside the success count
 */
export async function POST(request: Request) {
  try {
    const admin = await requireRole(request, ['admin']);
    const body = (await request.json()) as ImportRequest;

    if (!Array.isArray(body.rows)) {
      return NextResponse.json(
        { error: 'Expected `rows` array' },
        { status: 400 }
      );
    }

    // Pre-fetch lookups once for the whole import.
    const [allSubjects, allClasses, allSchedulesByDay] = await Promise.all([
      listSubjects(),
      listClasses(),
      // Fetch existing schedules grouped by day. We need all 7 days because
      // the CSV can target any. Eight reads is fine for one import action.
      Promise.all(
        (['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as DayOfWeek[]).map(
          async (d) => [d, await listSchedulesByDay(d)] as const
        )
      ),
    ]);
    const existingByDay = new Map(allSchedulesByDay);

    // Build lookup: (normalizedSubjectName, classId) → Subject
    // We resolve the class first via the resolver (handles partial names),
    // then look up the subject by name within that class.
    const subjectsByClass = new Map<string, typeof allSubjects>();
    for (const s of allSubjects) {
      const list = subjectsByClass.get(s.classId) ?? [];
      list.push(s);
      subjectsByClass.set(s.classId, list);
    }

    const errors: { row: number; message: string }[] = [];
    let created = 0;

    // Track schedules we've accepted this import. Persisted ones, plus the
    // newly-created ones we'll add as we go (so intra-batch conflicts are
    // caught — same CSV trying to put one teacher in two places).
    const acceptedThisImport: Schedule[] = [];

    for (let i = 0; i < body.rows.length; i++) {
      const row = body.rows[i];
      const rowNumber = i + 2; // header is row 1

      try {
        // --- Resolve class
        if (!row.class_section?.trim()) {
          throw new Error('class_section is required');
        }
        const classResult = resolveClassFromList(row.class_section, allClasses);
        if (!classResult.ok) {
          if (classResult.reason === 'ambiguous') {
            const names = classResult.matches
              .map((m) => `"${m.name} ${m.section}"`)
              .join(', ');
            throw new Error(
              `Class "${row.class_section}" matches multiple: ${names} — use a more specific name`
            );
          }
          throw new Error(`Class "${row.class_section}" not found`);
        }
        const klass = classResult.record;

        // --- Resolve subject within that class by name
        if (!row.subject_name?.trim()) {
          throw new Error('subject_name is required');
        }
        const targetName = normalizePersonName(row.subject_name);
        const candidates = subjectsByClass.get(klass.id) ?? [];
        const subject = candidates.find(
          (s) => normalizePersonName(s.name) === targetName
        );
        if (!subject) {
          throw new Error(
            `Subject "${row.subject_name}" not found in class "${klass.name}"`
          );
        }

        // --- Build candidate (createSchedule will normalize times/room internally)
        const dayLower = row.day_of_week?.trim().toLowerCase() ?? '';
        const validDays: readonly DayOfWeek[] = [
          'mon',
          'tue',
          'wed',
          'thu',
          'fri',
          'sat',
          'sun',
        ];
        if (!validDays.includes(dayLower as DayOfWeek)) {
          throw new Error(
            `day_of_week must be one of ${validDays.join(', ')}`
          );
        }
        const dayOfWeek = dayLower as DayOfWeek;

        // --- Conflict check against existing DB + previously-accepted rows
        // We do this BEFORE calling createSchedule because createSchedule
        // would only see the DB state, not the previously-accepted-this-import
        // rows. Doing it here lets us catch intra-batch conflicts in one pass.
        const candidate: CandidateSchedule = {
          subjectId: subject.id,
          classId: subject.classId,
          facultyId: subject.facultyId,
          dayOfWeek,
          // Times and room are normalized inside createSchedule, but for
          // conflict checking we need them normalized now. Reuse the same
          // logic via a minimal inline normalization.
          startTime: normalizeTimeForCheck(row.start_time ?? ''),
          endTime: normalizeTimeForCheck(row.end_time ?? ''),
          room: row.room?.trim() ? row.room.trim().replace(/\s+/g, ' ') : undefined,
        };

        if (candidate.startTime >= candidate.endTime) {
          throw new Error('end_time must be after start_time');
        }

        const sameDayExisting = existingByDay.get(dayOfWeek) ?? [];
        const sameDayAccepted = acceptedThisImport.filter(
          (s) => s.dayOfWeek === dayOfWeek
        );
        const conflicts = detectConflicts(candidate, [
          ...sameDayExisting,
          ...sameDayAccepted,
        ]);
        if (conflicts.length > 0) {
          throw new Error(conflicts.map((c) => c.message).join('; '));
        }

        // --- Persist via the service (this re-normalizes and re-validates,
        // but the conflict check is the expensive part and we've already done it).
        const newSchedule = await createSchedule({
          subjectId: subject.id,
          dayOfWeek,
          startTime: candidate.startTime,
          endTime: candidate.endTime,
          room: candidate.room,
        });
        acceptedThisImport.push(newSchedule);
        created++;
      } catch (err) {
        errors.push({
          row: rowNumber,
          message:
            err instanceof ZodError
              ? err.issues
                  .map((i) => `${i.path.join('.')}: ${i.message}`)
                  .join('; ')
              : err instanceof Error
                ? err.message
                : 'Unknown error',
        });
      }
    }

    console.log(
      `[POST /api/schedules/import] ${created} created, ${errors.length} failed by ${admin.uid}`
    );

    return NextResponse.json({ created, failed: errors.length, errors });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    console.error('[POST /api/schedules/import]', error);
    return NextResponse.json(
      { error: 'Failed to import schedules' },
      { status: 500 }
    );
  }
}

/**
 * Quick HH:MM normalization for conflict checking. Mirrors normalizeTime24
 * but throws a friendlier error using the row context (which the caller
 * already wraps).
 */
function normalizeTimeForCheck(input: string): string {
  const trimmed = input.trim();
  const m = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) throw new Error(`Invalid time "${input}" — expected HH:MM`);
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new Error(`Invalid time "${input}"`);
  }
  return `${String(hour).padStart(2, '0')}:${m[2]}`;
}
