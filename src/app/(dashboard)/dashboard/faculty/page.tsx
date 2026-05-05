import Link from 'next/link';
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { requirePageRole } from '@/services/auth.guards';
import { getUser } from '@/services/user.service';
import { listSchedulesByFaculty } from '@/services/schedule.service';
import { listSubjectsByFaculty } from '@/services/subject.service';
import { listClassesByAdviser } from '@/services/class.service';
import { listAnnouncements } from '@/services/announcement.service';
import { listEvents } from '@/services/event.service';
import type { DayOfWeek } from '@/features/schedules/types';

export const metadata = { title: 'Overview' };
export const dynamic = 'force-dynamic';

const DAY_KEYS: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

export default async function FacultyOverviewPage() {
  const auth = await requirePageRole(['faculty']);
  const profile = await getUser(auth.uid);
  const firstName = profile?.displayName?.split(' ')[0] ?? '';

  const today = DAY_KEYS[new Date().getDay()];
  const todayLabel = DAY_LABELS[today];

  const [schedules, subjects, advisedClasses, announcements, events] =
    await Promise.all([
      listSchedulesByFaculty(auth.uid),
      listSubjectsByFaculty(auth.uid),
      listClassesByAdviser(auth.uid),
      listAnnouncements(),
      listEvents(),
    ]);

  const todaySchedules = schedules
    .filter((s) => s.dayOfWeek === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  const recentAnnouncements = announcements
    .filter((a) => a.published)
    .slice(0, 3)
    .map((a) => ({
      type: 'announcement' as const,
      id: a.id,
      title: a.title,
      date: a.createdAt,
      detail: a.priority === 'high' ? 'Important' : '',
    }));
  const upcomingEvents = events
    .filter((e) => e.published && new Date(e.startDate) >= new Date())
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    )
    .slice(0, 3)
    .map((e) => ({
      type: 'event' as const,
      id: e.id,
      title: e.title,
      date: e.startDate,
      detail: e.location,
    }));
  const feed = [...upcomingEvents, ...recentAnnouncements];

  const homeroom = advisedClasses[0];

  return (
    <>
      <DashboardPageHeader
        title={firstName ? `Hi, ${firstName}` : 'Today'}
      />

      <div className="space-y-6 px-4 pb-10 sm:px-6">
        {/* SECTION 1 — Today's classes */}
        <section
          aria-labelledby="today-schedule"
          className="rounded-lg border border-slate-200 bg-white shadow-sm"
        >
          <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <h2
              id="today-schedule"
              className="text-sm font-semibold text-slate-900"
            >
              {todayLabel}&apos;s classes
            </h2>
            <Link
              href="/dashboard/faculty/schedule"
              className="text-xs font-medium text-blue-600 hover:text-blue-800"
            >
              Full week
            </Link>
          </header>

          {todaySchedules.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-500">
              No classes scheduled for {todayLabel.toLowerCase()}.
            </p>
          ) : (
            <ol className="divide-y divide-slate-100">
              {todaySchedules.map((s) => {
                const subj = subjectMap.get(s.subjectId);
                return (
                  <li
                    key={s.id}
                    className="flex items-start gap-4 border-l-4 border-blue-500 px-5 py-3"
                  >
                    <div className="w-24 shrink-0 font-mono text-xs text-slate-600">
                      {s.startTime}
                      <br />
                      <span className="text-slate-400">{s.endTime}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        {subj?.name ?? 'Unknown subject'}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {subj?.code}
                        {s.room && (
                          <>
                            {' '}
                            · <span>{s.room}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {/* SECTION 2 — Teaching summary */}
        <section
          aria-labelledby="teaching-summary"
          className="rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm"
        >
          <h2 id="teaching-summary" className="sr-only">
            Teaching summary
          </h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-slate-500">Subjects you teach</dt>
              <dd className="mt-0.5 text-sm font-medium text-slate-900">
                <Link
                  href="/dashboard/faculty/subjects"
                  className="hover:text-blue-700"
                >
                  {subjects.length} subject{subjects.length === 1 ? '' : 's'} →
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Classes you teach</dt>
              <dd className="mt-0.5 text-sm font-medium text-slate-900">
                {new Set(subjects.map((s) => s.classId)).size} class
                {new Set(subjects.map((s) => s.classId)).size === 1 ? '' : 'es'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Homeroom</dt>
              <dd className="mt-0.5 text-sm font-medium text-slate-900">
                {homeroom ? (
                  <Link
                    href="/dashboard/faculty/students"
                    className="hover:text-blue-700"
                  >
                    Grade {homeroom.gradeLevel} - {homeroom.name} →
                  </Link>
                ) : (
                  <span className="text-slate-500">Not assigned</span>
                )}
              </dd>
            </div>
          </dl>
        </section>

        {/* SECTION 3 — Latest from school */}
        <section
          aria-labelledby="latest"
          className="rounded-lg border border-slate-200 bg-white shadow-sm"
        >
          <h2
            id="latest"
            className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-900"
          >
            Latest from school
          </h2>
          {feed.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-500">
              No recent announcements or upcoming events.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {feed.map((item) => (
                <li key={`${item.type}-${item.id}`} className="px-5 py-3">
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 inline-block rounded border px-2 py-0.5 text-[11px] font-medium ${
                        item.type === 'event'
                          ? 'border-blue-200 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      {item.type === 'event' ? 'Event' : 'News'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {new Date(item.date).toLocaleDateString()}
                        {item.detail && ` · ${item.detail}`}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
