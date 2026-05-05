import { NextResponse } from 'next/server';
import { listSchedulesByDay } from '@/services/schedule.service';
import { getSubject } from '@/services/subject.service';
import { listSubjects } from '@/services/subject.service';
import { DayOfWeekSchema } from '@/features/schedules/schema';
import { requireRole } from '@/services/auth.service';

/**
 * GET /api/schedules/availability?subjectId=...&dayOfWeek=...
 *
 * Returns busy intervals for the subject's teacher and class on the given
 * day. The schedule form calls this when subject + day are selected, and
 * shows a hint like "Teacher is busy 08:00–09:00 (Math 7)" so admins don't
 * have to trial-and-error their way to a clean slot.
 *
 * Why a separate endpoint instead of computing client-side: the client
 * already has the schedules list (it can fetch /api/schedules), but
 * filtering and labelling them per teacher/class adds non-trivial logic
 * we don't want duplicated. This is a thin wrapper that returns exactly
 * what the form's hint UI needs.
 */
export async function GET(request: Request) {
  try {
    await requireRole(request, ['admin']);

    const url = new URL(request.url);
    const subjectId = url.searchParams.get('subjectId');
    const dayParam = url.searchParams.get('dayOfWeek');

    if (!subjectId) {
      return NextResponse.json(
        { error: 'subjectId is required' },
        { status: 400 }
      );
    }
    const dayParse = DayOfWeekSchema.safeParse(dayParam);
    if (!dayParse.success) {
      return NextResponse.json(
        { error: 'dayOfWeek must be one of mon|tue|wed|thu|fri|sat|sun' },
        { status: 400 }
      );
    }
    const dayOfWeek = dayParse.data;

    const subject = await getSubject(subjectId);
    if (!subject) {
      return NextResponse.json(
        { error: `Subject ${subjectId} not found` },
        { status: 404 }
      );
    }

    // Fetch all schedules on this day plus all subjects for label lookup.
    // Two reads: one filtered to dayOfWeek, one for the subject lookup table.
    const [sameDay, allSubjects] = await Promise.all([
      listSchedulesByDay(dayOfWeek),
      listSubjects(),
    ]);
    const subjectMap = new Map(allSubjects.map((s) => [s.id, s]));

    const teacherBusy = sameDay
      .filter((s) => s.facultyId === subject.facultyId)
      .map((s) => ({
        start: s.startTime,
        end: s.endTime,
        label: subjectMap.get(s.subjectId)?.name ?? 'Subject',
      }));

    const classBusy = sameDay
      .filter((s) => s.classId === subject.classId)
      .map((s) => ({
        start: s.startTime,
        end: s.endTime,
        label: subjectMap.get(s.subjectId)?.name ?? 'Subject',
      }));

    return NextResponse.json({ teacherBusy, classBusy });
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
    console.error('[GET /api/schedules/availability]', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}
