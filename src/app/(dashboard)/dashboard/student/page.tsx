import Link from 'next/link';
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { requirePageRole } from '@/services/auth.guards';
import { getUser } from '@/services/user.service';
import { getClass } from '@/services/class.service';
import { listSchedulesByClass } from '@/services/schedule.service';
import { listSubjectsByClass } from '@/services/subject.service';
import { listUsersByRole } from '@/services/user.service';
import { listRecentAnnouncements } from '@/services/announcement.service';
import { listUpcomingEvents } from '@/services/event.service';
import type { DayOfWeek } from '@/features/schedules/types';

export const metadata = { title: 'Overview' };
export const dynamic = 'force-dynamic';

const DAY_KEYS: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAY_FULL_NAMES: Record<DayOfWeek, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

function formatTime(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  const period = h >= 12 ? 'PM' : 'AM';
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}:${mStr} ${period}`;
}

export default async function StudentOverviewPage() {
  const auth = await requirePageRole(['student']);
  const profile = await getUser(auth.uid);

  // If the student has no class assigned, show a setup-needed banner instead
  if (!profile?.classId) {
    return (
      <>
        <DashboardPageHeader
          title={`Welcome${profile?.displayName ? `, ${profile.displayName}` : ''}`}
        />
        <div className="p-6 sm:p-8">
          <div className="border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
            <p className="font-medium">Account setup pending</p>
            <p className="mt-2">
              You haven&apos;t been assigned to a class yet. Please contact your
              school administrator so they can complete your account setup.
            </p>
          </div>
        </div>
      </>
    );
  }

  // Parallel fetches for everything we need on the overview
  const [
    classRecord,
    schedules,
    subjects,
    allFaculty,
    announcements,
    events,
  ] = await Promise.all([
    getClass(profile.classId),
    listSchedulesByClass(profile.classId),
    listSubjectsByClass(profile.classId),
    listUsersByRole('faculty'),
    listRecentAnnouncements(3),
    listUpcomingEvents(3),
  ]);

  const facultyMap = new Map(allFaculty.map((f) => [f.uid, f]));
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const adviser = classRecord?.adviserId
    ? facultyMap.get(classRecord.adviserId)
    : null;

  // Today's classes
  const todayKey = DAY_KEYS[new Date().getDay()];
  const todaysSchedule = schedules
    .filter((s) => s.dayOfWeek === todayKey)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <>
      <DashboardPageHeader
        title={`Welcome${profile.displayName ? `, ${profile.displayName.split(' ')[0]}` : ''}`}
        description={
          classRecord
            ? `Grade ${classRecord.gradeLevel} - ${classRecord.name} · ${classRecord.schoolYear}`
            : undefined
        }
      />

      <div className="space-y-8 p-6 sm:p-8">
        {/* Today's classes — most important info above the fold */}
        <section aria-labelledby="today-heading">
          <div className="mb-3 flex items-center justify-between">
            <h2
              id="today-heading"
              className="font-serif text-lg font-semibold text-slate-900"
            >
              {DAY_FULL_NAMES[todayKey]}&apos;s classes
            </h2>
            <Link
              href="/dashboard/student/schedule"
              className="text-xs font-medium text-[#0f1f3a] hover:underline"
            >
              View full schedule →
            </Link>
          </div>

          {todaysSchedule.length === 0 ? (
            <div className="border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="text-sm text-slate-600">
                No classes scheduled today. Enjoy your day!
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {todaysSchedule.map((slot) => {
                const subject = subjectMap.get(slot.subjectId);
                const teacher = facultyMap.get(slot.facultyId);
                return (
                  <li
                    key={slot.id}
                    className="flex items-center gap-4 border-l-4 border-[#c8a85c] bg-white p-4 shadow-sm"
                  >
                    <div className="min-w-[120px] font-mono text-xs font-medium text-slate-700 sm:text-sm">
                      <p>{formatTime(slot.startTime)}</p>
                      <p className="text-slate-500">
                        {formatTime(slot.endTime)}
                      </p>
                    </div>
                    <div className="flex-1 border-l border-slate-200 pl-4">
                      <p className="text-sm font-semibold text-slate-900 sm:text-base">
                        {subject?.name ?? 'Unknown subject'}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {subject?.code}
                        {teacher ? ` · ${teacher.displayName}` : ''}
                        {slot.room ? ` · ${slot.room}` : ''}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Quick info cards */}
        <section aria-labelledby="info-heading" className="grid gap-4 sm:grid-cols-3">
          <h2 id="info-heading" className="sr-only">
            Class information
          </h2>

          <div className="border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Class
            </p>
            <p className="mt-2 font-serif text-lg font-semibold text-slate-900">
              {classRecord ? `Grade ${classRecord.gradeLevel} - ${classRecord.name}` : '—'}
            </p>
            {classRecord?.section && (
              <p className="mt-0.5 text-xs text-slate-500">
                Section {classRecord.section}
              </p>
            )}
          </div>

          <Link
            href="/dashboard/student/adviser"
            className="block border border-slate-200 bg-white p-5 transition-colors hover:border-[#0f1f3a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8a85c]"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Adviser
            </p>
            <p className="mt-2 font-serif text-lg font-semibold text-slate-900">
              {adviser?.displayName ?? 'Not assigned'}
            </p>
            {adviser?.department && (
              <p className="mt-0.5 text-xs text-slate-500">{adviser.department}</p>
            )}
            {adviser && (
              <p className="mt-3 text-xs font-medium text-[#0f1f3a]">
                Contact details →
              </p>
            )}
          </Link>

          <Link
            href="/dashboard/student/subjects"
            className="block border border-slate-200 bg-white p-5 transition-colors hover:border-[#0f1f3a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8a85c]"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Subjects
            </p>
            <p className="mt-2 font-serif text-lg font-semibold text-slate-900">
              {subjects.length}
            </p>
            <p className="mt-3 text-xs font-medium text-[#0f1f3a]">
              View all subjects →
            </p>
          </Link>
        </section>

        {/* Recent announcements + upcoming events */}
        <section className="grid gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold text-slate-900">
                Recent announcements
              </h2>
              <Link
                href="/announcements"
                className="text-xs font-medium text-[#0f1f3a] hover:underline"
              >
                View all →
              </Link>
            </div>
            <div className="border border-slate-200 bg-white">
              {announcements.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">
                  No announcements right now.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {announcements.map((a) => (
                    <li key={a.id} className="p-4">
                      <p className="text-sm font-medium text-slate-900">
                        {a.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                        {a.summary}
                      </p>
                      <p className="mt-2 text-[11px] text-slate-400">
                        {new Date(a.createdAt).toLocaleDateString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold text-slate-900">
                Upcoming events
              </h2>
              <Link
                href="/events"
                className="text-xs font-medium text-[#0f1f3a] hover:underline"
              >
                View all →
              </Link>
            </div>
            <div className="border border-slate-200 bg-white">
              {events.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">
                  Nothing on the calendar yet.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {events.map((e) => (
                    <li key={e.id} className="p-4">
                      <p className="text-sm font-medium text-slate-900">
                        {e.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(e.startDate).toLocaleDateString()} ·{' '}
                        {e.location}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
