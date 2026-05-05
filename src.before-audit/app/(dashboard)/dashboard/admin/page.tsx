import Link from 'next/link';
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { listEvents } from '@/services/event.service';
import { listAnnouncements } from '@/services/announcement.service';
import { listUsers } from '@/services/user.service';
import { listClasses } from '@/services/class.service';
import { listSubjects } from '@/services/subject.service';
import { listSchedules } from '@/services/schedule.service';
import { requirePageRole } from '@/services/auth.guards';
import { getUser } from '@/services/user.service';

export const metadata = { title: 'Overview' };
export const dynamic = 'force-dynamic';

interface QuickActionProps {
  href: string;
  label: string;
  icon: React.ReactNode;
}

function QuickAction({ href, label, icon }: QuickActionProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-start gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
    >
      <span
        aria-hidden="true"
        className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-600 group-hover:bg-blue-100"
      >
        {icon}
      </span>
      <span className="text-sm font-medium text-slate-900">{label}</span>
    </Link>
  );
}

interface AlertItemProps {
  count: number;
  label: string;
  href: string;
  severity: 'warn' | 'info';
}

function AlertItem({ count, label, href, severity }: AlertItemProps) {
  const severityClass =
    severity === 'warn'
      ? 'text-amber-700'
      : 'text-blue-700';
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
    >
      <span className="text-slate-700">
        <span className={`font-semibold ${severityClass}`}>{count}</span> {label}
      </span>
      <span className="text-xs text-slate-400 group-hover:text-slate-600">→</span>
    </Link>
  );
}

export default async function AdminOverviewPage() {
  const auth = await requirePageRole(['admin']);
  const profile = await getUser(auth.uid);
  const firstName = profile?.displayName?.split(' ')[0] ?? '';

  // Parallel reads
  const [events, announcements, users, classes, subjects, schedules] =
    await Promise.all([
      listEvents(),
      listAnnouncements(),
      listUsers(),
      listClasses(),
      listSubjects(),
      listSchedules(),
    ]);

  // Compute stats
  const studentCount = users.filter((u) => u.role === 'student').length;
  const facultyCount = users.filter((u) => u.role === 'faculty').length;

  // Compute "needs attention" items
  const unassignedStudents = users.filter(
    (u) => u.role === 'student' && !u.classId
  ).length;
  const classesWithoutAdviser = classes.filter((c) => !c.adviserId).length;
  const upcomingEvents = events.filter(
    (e) => new Date(e.startDate) >= new Date()
  ).length;

  // Recent items (5 most recent each)
  const recentAnnouncements = announcements.slice(0, 4);
  const recentEvents = events
    .filter((e) => new Date(e.startDate) >= new Date())
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    )
    .slice(0, 4);

  const hasAlerts =
    unassignedStudents > 0 || classesWithoutAdviser > 0;

  return (
    <>
      <DashboardPageHeader
        title={
          firstName ? `Good day, ${firstName}` : 'Admin overview'
        }
      />

      <div className="space-y-6 px-4 pb-10 sm:px-6">
        {/* Quick actions */}
        <section aria-labelledby="quick-actions">
          <h2
            id="quick-actions"
            className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500"
          >
            Quick actions
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <QuickAction
              href="/dashboard/admin/users?action=import"
              label="Import students (CSV)"
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              }
            />
            <QuickAction
              href="/dashboard/admin/users/new"
              label="Add a user"
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              }
            />
            <QuickAction
              href="/dashboard/admin/announcements/new"
              label="Post announcement"
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              }
            />
            <QuickAction
              href="/dashboard/admin/events/new"
              label="Add an event"
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
          </div>
        </section>

        {/* At a glance — single row */}
        <section
          aria-labelledby="at-a-glance"
          className="rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm"
        >
          <h2
            id="at-a-glance"
            className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500"
          >
            At a glance
          </h2>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <dt className="text-xs text-slate-500">Students</dt>
              <dd className="mt-0.5 text-2xl font-semibold text-slate-900">
                {studentCount}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Faculty</dt>
              <dd className="mt-0.5 text-2xl font-semibold text-slate-900">
                {facultyCount}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Classes</dt>
              <dd className="mt-0.5 text-2xl font-semibold text-slate-900">
                {classes.length}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Subjects</dt>
              <dd className="mt-0.5 text-2xl font-semibold text-slate-900">
                {subjects.length}
              </dd>
            </div>
          </dl>
        </section>

        {/* Needs attention + Schedule entries (compact secondary row) */}
        <div className="grid gap-4 lg:grid-cols-3">
          <section
            aria-labelledby="attention"
            className={`rounded-lg border bg-white shadow-sm lg:col-span-2 ${
              hasAlerts ? 'border-amber-200' : 'border-slate-200'
            }`}
          >
            <h2
              id="attention"
              className="border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500"
            >
              Needs attention
            </h2>
            <div className="px-2 py-2">
              {hasAlerts ? (
                <ul className="space-y-0.5">
                  {unassignedStudents > 0 && (
                    <li>
                      <AlertItem
                        count={unassignedStudents}
                        label={`student${unassignedStudents === 1 ? '' : 's'} not assigned to a class`}
                        href="/dashboard/admin/users?role=student"
                        severity="warn"
                      />
                    </li>
                  )}
                  {classesWithoutAdviser > 0 && (
                    <li>
                      <AlertItem
                        count={classesWithoutAdviser}
                        label={`class${classesWithoutAdviser === 1 ? '' : 'es'} without an adviser`}
                        href="/dashboard/admin/classes"
                        severity="warn"
                      />
                    </li>
                  )}
                </ul>
              ) : (
                <p className="px-3 py-3 text-sm text-slate-500">
                  Everything looks good. No items need attention right now.
                </p>
              )}
            </div>
          </section>

          <section
            aria-labelledby="upcoming-summary"
            className="rounded-lg border border-slate-200 bg-white shadow-sm"
          >
            <h2
              id="upcoming-summary"
              className="border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500"
            >
              Upcoming
            </h2>
            <div className="px-5 py-4">
              <p className="text-2xl font-semibold text-slate-900">
                {upcomingEvents}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                event{upcomingEvents === 1 ? '' : 's'} on the calendar
              </p>
            </div>
          </section>
        </div>

        {/* Recent activity — two columns */}
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-slate-900">
                Recent announcements
              </h2>
              <Link
                href="/dashboard/admin/announcements"
                className="text-xs font-medium text-blue-600 hover:text-blue-800"
              >
                View all
              </Link>
            </header>
            {recentAnnouncements.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-500">
                No announcements yet.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentAnnouncements.map((a) => (
                  <li key={a.id} className="px-5 py-3">
                    <Link
                      href={`/dashboard/admin/announcements/${a.id}/edit`}
                      className="block hover:text-blue-700"
                    >
                      <p className="text-sm font-medium text-slate-900">
                        {a.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {new Date(a.createdAt).toLocaleDateString()}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-slate-900">
                Upcoming events
              </h2>
              <Link
                href="/dashboard/admin/events"
                className="text-xs font-medium text-blue-600 hover:text-blue-800"
              >
                View all
              </Link>
            </header>
            {recentEvents.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-500">
                No upcoming events.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentEvents.map((e) => (
                  <li key={e.id} className="px-5 py-3">
                    <Link
                      href={`/dashboard/admin/events/${e.id}/edit`}
                      className="block hover:text-blue-700"
                    >
                      <p className="text-sm font-medium text-slate-900">
                        {e.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {new Date(e.startDate).toLocaleDateString()} · {e.location}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
