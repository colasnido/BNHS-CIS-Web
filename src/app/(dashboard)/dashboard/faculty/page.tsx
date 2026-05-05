import Link from "next/link";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { requirePageRole } from "@/services/auth.guards";
import { getUser } from "@/services/user.service";
import { listSchedulesByFaculty } from "@/services/schedule.service";
import { listSubjectsByFaculty } from "@/services/subject.service";
import { listClassesByAdviser } from "@/services/class.service";
import { listClasses } from "@/services/class.service";
import { listStudentsByClass } from "@/services/user.service";
import { listRecentAnnouncements } from "@/services/announcement.service";
import { listUpcomingEvents } from "@/services/event.service";
import type { DayOfWeek } from "@/features/schedules/types";

export const metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

const DAY_KEYS: DayOfWeek[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const DAY_FULL_NAMES: Record<DayOfWeek, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

function formatTime(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr);
  const period = h >= 12 ? "PM" : "AM";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}:${mStr} ${period}`;
}

export default async function FacultyOverviewPage() {
  const auth = await requirePageRole(["faculty"]);
  const profile = await getUser(auth.uid);

  // Parallel fetches for everything we need on the overview
  const [
    schedules,
    subjects,
    advisedClasses,
    allClasses,
    announcements,
    events,
  ] = await Promise.all([
    listSchedulesByFaculty(auth.uid),
    listSubjectsByFaculty(auth.uid),
    listClassesByAdviser(auth.uid),
    listClasses(),
    listRecentAnnouncements(3),
    listUpcomingEvents(3),
  ]);

  const classMap = new Map(allClasses.map((c) => [c.id, c]));
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  // The faculty member is "homeroom adviser" of advisedClasses[0] in our data model
  // (one homeroom per adviser is the norm; we still handle the array case)
  const homeroom = advisedClasses[0] ?? null;

  // Count students in advised homeroom (separate fetch — only needed if there is one)
  const adviseeCount = homeroom
    ? (await listStudentsByClass(homeroom.id)).length
    : 0;

  // Today's classes
  const todayKey = DAY_KEYS[new Date().getDay()];
  const todaysSchedule = schedules
    .filter((s) => s.dayOfWeek === todayKey)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <>
      <DashboardPageHeader
        title={`Welcome${profile?.displayName ? `, ${profile.displayName.split(" ")[0]}` : ""}`}
        description={profile?.department ?? undefined}
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
              href="/dashboard/faculty/schedule"
              className="text-xs font-medium text-[#0f1f3a] hover:underline"
            >
              View full schedule →
            </Link>
          </div>

          {todaysSchedule.length === 0 ? (
            <div className="border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="text-sm text-slate-600">
                No classes scheduled today.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {todaysSchedule.map((slot) => {
                const subject = subjectMap.get(slot.subjectId);
                const cls = classMap.get(slot.classId);
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
                        {subject?.name ?? "Unknown subject"}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {subject?.code}
                        {cls ? ` · Grade ${cls.gradeLevel} - ${cls.name}` : ""}
                        {slot.room ? ` · ${slot.room}` : ""}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Quick stat cards */}
        <section
          aria-labelledby="stats-heading"
          className="grid gap-4 sm:grid-cols-3"
        >
          <h2 id="stats-heading" className="sr-only">
            My teaching summary
          </h2>

          <Link
            href="/dashboard/faculty/subjects"
            className="block border border-slate-200 bg-white p-5 transition-colors hover:border-[#0f1f3a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8a85c]"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              My subjects
            </p>
            <p className="mt-2 font-serif text-3xl font-semibold text-slate-900">
              {subjects.length}
            </p>
            <p className="mt-3 text-xs font-medium text-[#0f1f3a]">
              View subjects →
            </p>
          </Link>

          <Link
            href="/dashboard/faculty/students"
            className="block border border-slate-200 bg-white p-5 transition-colors hover:border-[#0f1f3a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8a85c]"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {homeroom ? "My homeroom" : "Homeroom"}
            </p>
            <p className="mt-2 font-serif text-3xl font-semibold text-slate-900">
              {adviseeCount}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {homeroom
                ? `Grade ${homeroom.gradeLevel} - ${homeroom.name}`
                : "No homeroom assigned"}
            </p>
            {homeroom && (
              <p className="mt-3 text-xs font-medium text-[#0f1f3a]">
                View students →
              </p>
            )}
          </Link>

          <Link
            href="/dashboard/faculty/schedule"
            className="block border border-slate-200 bg-white p-5 transition-colors hover:border-[#0f1f3a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8a85c]"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Weekly meetings
            </p>
            <p className="mt-2 font-serif text-3xl font-semibold text-slate-900">
              {schedules.length}
            </p>
            <p className="mt-3 text-xs font-medium text-[#0f1f3a]">
              View schedule →
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
                        {new Date(e.startDate).toLocaleDateString()} ·{" "}
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
