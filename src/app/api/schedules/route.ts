import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import {
  listSchedules,
  createSchedule,
  createScheduleBatch,
} from '@/services/schedule.service';
import { ScheduleConflictError } from '@/services/scheduling.validator';
import { requireRole } from '@/services/auth.service';

/**
 * Schedules collection endpoint.
 *
 * POST accepts two shapes:
 *   - Single schedule: { subjectId, dayOfWeek, startTime, endTime, room? }
 *   - Batch:           { subjectId, daysOfWeek: [...], startTime, endTime, room? }
 *
 * The batch shape is the audit fix #5 "repeat schedule" feature — admin can
 * create Mon/Wed/Fri Math at 8 AM in one POST instead of three.
 */

export async function GET(request: Request) {
  try {
    await requireRole(request, ['admin', 'faculty', 'student']);
    const schedules = await listSchedules();
    return NextResponse.json({ data: schedules });
  } catch (error) {
    return handleError(error, 'fetch');
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireRole(request, ['admin']);
    const body = await request.json();

    // Batch shape detection — `daysOfWeek` is the discriminator.
    if (body && typeof body === 'object' && Array.isArray((body as { daysOfWeek?: unknown }).daysOfWeek)) {
      const created = await createScheduleBatch(body);
      console.log(
        `[POST /api/schedules] Created ${created.length} schedules by ${admin.uid}`
      );
      return NextResponse.json({ data: created }, { status: 201 });
    }

    // Single shape — current default
    const schedule = await createSchedule(body);
    console.log(`[POST /api/schedules] Created ${schedule.id} by ${admin.uid}`);
    return NextResponse.json({ data: schedule }, { status: 201 });
  } catch (error) {
    return handleError(error, 'create');
  }
}

function handleError(error: unknown, action: string) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        issues: error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      },
      { status: 400 }
    );
  }
  if (error instanceof ScheduleConflictError) {
    // Use 409 Conflict — semantically correct for "your request is well-formed
    // but conflicts with the current state". Frontend distinguishes this from
    // 400 (bad input) and 500 (server bug).
    return NextResponse.json(
      {
        error: 'Schedule conflict',
        conflicts: error.conflicts,
      },
      { status: 409 }
    );
  }
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
  // Surface domain errors (subject not found, etc.) as 400 with their text
  if (error instanceof Error) {
    if (
      error.message.includes('does not exist') ||
      error.message.includes('not found') ||
      error.message.includes('End time must be')
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }
  console.error(`[/api/schedules] ${action}`, error);
  return NextResponse.json(
    { error: `Failed to ${action} schedule` },
    { status: 500 }
  );
}
