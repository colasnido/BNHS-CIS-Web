import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { requireRole } from '@/services/auth.service';
import { createSchedule } from '@/services/schedule.service';
import { listSubjects } from '@/services/subject.service';

interface ImportRow {
  subject_code?: string;
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
 * Notable: schedules CSV references subjects by code (admin-friendly),
 * not by ID. The subject already has classId and facultyId baked in, so
 * those are inherited automatically — admin only needs to specify the
 * meeting time and room.
 *
 * This is the single biggest workflow win: a typical school week has
 * ~40 schedule slots. Without CSV, that's 40 form submissions. With CSV,
 * it's 40 lines pasted from a Google Sheet.
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

    const subjects = await listSubjects();
    const subjectByCode = new Map(
      subjects.map((s) => [s.code.toLowerCase(), s])
    );

    const errors: { row: number; message: string }[] = [];
    let created = 0;

    for (let i = 0; i < body.rows.length; i++) {
      const row = body.rows[i];
      const rowNumber = i + 2;

      try {
        const subject = subjectByCode.get(
          row.subject_code?.trim().toLowerCase() ?? ''
        );
        if (!subject) {
          throw new Error(`No subject found with code "${row.subject_code}"`);
        }

        const input: Record<string, unknown> = {
          subjectId: subject.id,
          classId: subject.classId, // inherited
          facultyId: subject.facultyId, // inherited
          dayOfWeek: row.day_of_week?.trim().toLowerCase(),
          startTime: row.start_time?.trim(),
          endTime: row.end_time?.trim(),
        };
        if (row.room?.trim()) input.room = row.room.trim();

        await createSchedule(input);
        created++;
      } catch (err) {
        errors.push({
          row: rowNumber,
          message:
            err instanceof ZodError
              ? err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
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
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    console.error('[POST /api/schedules/import]', error);
    return NextResponse.json({ error: 'Failed to import schedules' }, { status: 500 });
  }
}
