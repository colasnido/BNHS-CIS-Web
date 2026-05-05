import Link from 'next/link';
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { listEvents } from '@/services/event.service';
import { listAnnouncements } from '@/services/announcement.service';
import { listUsers } from '@/services/user.service';
import { listClasses } from '@/services/class.service';
import { listSubjects } from '@/services/subject.service';
import { listSchedules } from '@/services/schedule.service';

export const metadata = { title: 'Overview' };

interface StatCardProps {
  label: string;
  value: number;
  href: string;
}

function StatCard({ label, value, href }: StatCardProps) {
  return (
    <Link
      href={href}
      className="block border border-slate-200 bg-white p-6 transition-colors hover:border-[#0f1f3a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8a85c]"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-2 font-serif text-3xl font-semibold text-slate-900">
        {value}
      </p>
      <p className="mt-3 text-xs font-medium text-[#0f1f3a]">
        Manage →
      </p>
    </Link>
  );
}

export default async function AdminOverviewPage() {
  // Parallel reads — service layer handles missing-collection errors
  const [events, announcements, users, classes, subjects, schedules] =
    await Promise.all([
      listEvents(),
      listAnnouncements(),
      listUsers(),
      listClasses(),
      listSubjects(),
      listSchedules(),
    ]);

  const studentCount = users.filter((u) => u.role === 'student').length;
  const facultyCount = users.filter((u) => u.role === 'faculty').length;
  const adminCount = users.filter((u) => u.role === 'admin').length;

  return (
    <>
      <DashboardPageHeader
        title="Overview"
        description="Quick view of school-wide activity and content."
      />

      <div className="space-y-8 p-6 sm:p-8">
        {/* Primary stats */}
        <section aria-labelledby="content-stats">
          <h2
            id="content-stats"
            className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500"
          >
            Public content
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Announcements"
              value={announcements.length}
              href="/dashboard/admin/announcements"
            />
            <StatCard
              label="Events"
              value={events.length}
              href="/dashboard/admin/events"
            />
          </div>
        </section>

        <section aria-labelledby="people-stats">
          <h2
            id="people-stats"
            className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500"
          >
            People
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Students"
              value={studentCount}
              href="/dashboard/admin/users"
            />
            <StatCard
              label="Faculty"
              value={facultyCount}
              href="/dashboard/admin/users"
            />
            <StatCard
              label="Admins"
              value={adminCount}
              href="/dashboard/admin/users"
            />
          </div>
        </section>

        <section aria-labelledby="academic-stats">
          <h2
            id="academic-stats"
            className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500"
          >
            Academic
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Classes"
              value={classes.length}
              href="/dashboard/admin/classes"
            />
            <StatCard
              label="Subjects"
              value={subjects.length}
              href="/dashboard/admin/subjects"
            />
            <StatCard
              label="Schedule entries"
              value={schedules.length}
              href="/dashboard/admin/schedules"
            />
          </div>
        </section>

        {/* Recent items */}
        <section
          aria-labelledby="recent"
          className="grid gap-6 lg:grid-cols-2"
        >
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 id="recent" className="font-serif text-lg font-semibold text-slate-900">
                Recent announcements
              </h2>
              <Link
                href="/dashboard/admin/announcements"
                className="text-xs font-medium text-[#0f1f3a] hover:underline"
              >
                View all →
              </Link>
            </div>
            <div className="border border-slate-200 bg-white">
              {announcements.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">No announcements yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {announcements.slice(0, 5).map((a) => (
                    <li key={a.id} className="p-4">
                      <p className="text-sm font-medium text-slate-900">{a.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
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
                href="/dashboard/admin/events"
                className="text-xs font-medium text-[#0f1f3a] hover:underline"
              >
                View all →
              </Link>
            </div>
            <div className="border border-slate-200 bg-white">
              {events.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">No events scheduled.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {events.slice(0, 5).map((e) => (
                    <li key={e.id} className="p-4">
                      <p className="text-sm font-medium text-slate-900">{e.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(e.startDate).toLocaleDateString()} · {e.location}
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
