import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/services/auth.service';
import { createSchedule } from '@/services/schedule.service';
import { listClasses } from '@/services/class.service';
import { listSubjects } from '@/services/subject.service';

/**
 * POST /api/csv-import/schedules
 *
 * Body: { rows: [{ subjectName, classSection, dayOfWeek, startTime, endTime, room? }] }
 *
 * Differs from users import in two ways:
 *   1. Subject and class are referenced BY NAME — we resolve to IDs server-side
 *   2. Conflict detection is naturally handled by createSchedule's
 *      assertNoScheduleConflict check (per the audit-fix package)
 *
 * Each row creates one schedule; failures don't halt the batch. The
 * intra-batch conflict detection (within a single import) is handled by
 * the fact that each row is committed sequentially — by the time row 2
 * is processed, row 1 is already in the DB and the conflict checker sees it.
 */

const ClientRowSchema = z.object({
  subjectName: z.string().min(1),
  classSection: z.string().min(1),
  dayOfWeek: z.string().min(1),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  room: z.string().optional(),
});

const BodySchema = z.object({
  rows: z.array(ClientRowSchema).min(1).max(2000),
});

export async function POST(request: Request) {
  try {
    await requireRole(request, ['admin']);
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const parsedBody = BodySchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? 'Invalid rows' },
      { status: 400 }
    );
  }

  const { rows } = parsedBody.data;

  // ---------- Pre-load classes + subjects ----------
  const [classes, subjects] = await Promise.all([
    listClasses(),
    listSubjects(),
  ]);

  // class lookup: section name (case-insensitive)
  const classBySection = new Map(
    classes.map((c) => [c.section.trim().toLowerCase(), c])
  );

  // subject lookup: keyed by "subjectName::classId" so the same subject name
  // for different classes resolves correctly
  const subjectsByNameAndClass = new Map<string, (typeof subjects)[number]>();
  for (const s of subjects) {
    const key = `${s.name.trim().toLowerCase()}::${s.classId}`;
    subjectsByNameAndClass.set(key, s);
  }

  // ---------- Process rows ----------
  const errors: { row: number; message: string }[] = [];
  let created = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i++) {
    const rowNumber = i + 2;
    const clientRow = rows[i];

    try {
      // Resolve class
      const cls = classBySection.get(
        clientRow.classSection.trim().toLowerCase()
      );
      if (!cls) {
        throw new Error(
          `Class "${clientRow.classSection}" not found. Create it first.`
        );
      }

      // Resolve subject (must be in the resolved class)
      const subjectKey = `${clientRow.subjectName.trim().toLowerCase()}::${cls.id}`;
      const subject = subjectsByNameAndClass.get(subjectKey);
      if (!subject) {
        throw new Error(
          `Subject "${clientRow.subjectName}" not found in class "${cls.section}".`
        );
      }

      // Build the schedule input. createSchedule derives classId/facultyId
      // from subject; we just pass subjectId + the time/room data.
      await createSchedule({
        subjectId: subject.id,
        dayOfWeek: clientRow.dayOfWeek,
        startTime: clientRow.startTime,
        endTime: clientRow.endTime,
        room: clientRow.room,
      });

      created++;
    } catch (error) {
      failed++;
      const message =
        error instanceof z.ZodError
          ? error.issues
              .map((iss) => `${iss.path.join('.')}: ${iss.message}`)
              .join('; ')
          : error instanceof Error
            ? error.message
            : 'Unknown error';
      errors.push({ row: rowNumber, message });
    }
  }

  return NextResponse.json({ created, failed, errors });
}
