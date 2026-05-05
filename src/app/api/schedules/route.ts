import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { listSchedules, createSchedule } from '@/services/schedule.service';
import { requireRole } from '@/services/auth.service';

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
        issues: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
      { status: 400 }
    );
  }
  if (error instanceof Error && error.message === 'UNAUTHORIZED') {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  if (error instanceof Error && error.message === 'FORBIDDEN') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }
  console.error(`[/api/schedules] ${action}`, error);
  return NextResponse.json({ error: `Failed to ${action} schedule` }, { status: 500 });
}
