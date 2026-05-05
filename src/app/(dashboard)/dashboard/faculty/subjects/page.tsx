import Link from "next/link";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { requirePageRole } from "@/services/auth.guards";
import { listSubjectsByFaculty } from "@/services/subject.service";
import { listSchedulesByFaculty } from "@/services/schedule.service";
import { listClasses } from "@/services/class.service";
import { listStudentsByClass } from "@/services/user.service";
import type { DayOfWeek } from "@/features/schedules/types";

export const metadata = { title: "My subjects" };
export const dynamic = "force-dynamic";

const DAY_SHORT: Record<DayOfWeek, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

const DAY_ORDER: DayOfWeek[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

export default async function FacultySubjectsPage() {
  const auth = await requirePageRole(["faculty"]);

  const [subjects, schedules, allClasses] = await Promise.all([
    listSubjectsByFaculty(auth.uid),
    listSchedulesByFaculty(auth.uid),
    listClasses(),
  ]);

  const classMap = new Map(allClasses.map((c) => [c.id, c]));

  // For each subject, count students in its class (parallel fetch)
  // and compute meeting days
  const subjectStats = await Promise.all(
    subjects.map(async (subject) => {
      const studentCount = (await listStudentsByClass(subject.classId)).length;

      const days = new Set<DayOfWeek>();
      for (const slot of schedules) {
        if (slot.subjectId === subject.id) {
          days.add(slot.dayOfWeek);
        }
      }
      const meetingDays = [...days].sort(
        (a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b),
      );

      return { subject, studentCount, meetingDays };
    }),
  );

  return (
    <>
      <DashboardPageHeader
        title="My subjects"
        description={
          subjects.length === 0
            ? "Subjects you teach."
            : `Teaching ${subjects.length} subject${subjects.length === 1 ? "" : "s"}.`
        }
      />

      <div className="p-6 sm:p-8">
        {subjects.length === 0 ? (
          <div className="border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="font-serif text-lg text-slate-700">
              No subjects assigned yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              You haven&apos;t been assigned any subjects to teach. Please
              contact the school administrator.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjectStats.map(({ subject, studentCount, meetingDays }) => {
              const cls = classMap.get(subject.classId);
              return (
                <article
                  key={subject.id}
                  className="border border-slate-200 bg-white p-5"
                >
                  {/* Audit fix #5: subject.code removed */}
                  <h3 className="font-serif text-lg font-semibold text-slate-900">
                    {subject.name}
                  </h3>

                  {subject.description && (
                    <p className="mt-2 line-clamp-2 text-xs text-slate-600">
                      {subject.description}
                    </p>
                  )}

                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Class
                      </p>
                      {cls ? (
                        <Link
                          href={`/dashboard/faculty/students?classId=${cls.id}`}
                          className="text-sm text-[#0f1f3a] hover:underline"
                        >
                          Grade {cls.gradeLevel} - {cls.name} ({cls.section})
                        </Link>
                      ) : (
                        <p className="text-sm text-slate-500">—</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Students
                        </p>
                        <p className="text-sm font-medium text-slate-900">
                          {studentCount}
                        </p>
                      </div>

                      {meetingDays.length > 0 && (
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Meets
                          </p>
                          <p className="text-sm text-slate-900">
                            {meetingDays.map((d) => DAY_SHORT[d]).join(" · ")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
