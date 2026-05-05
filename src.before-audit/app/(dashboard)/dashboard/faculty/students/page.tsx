import Link from "next/link";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { requirePageRole } from "@/services/auth.guards";
import { listSubjectsByFaculty } from "@/services/subject.service";
import { listClassesByAdviser, getClass } from "@/services/class.service";
import { listStudentsByClass } from "@/services/user.service";
import type { ClassRecord } from "@/features/classes/types";
import type { User } from "@/features/users/types";

export const metadata = { title: "My students" };
export const dynamic = "force-dynamic";

interface PageProps {
  // Optional ?classId=xxx filter so links from the subjects page work
  searchParams: Promise<{ classId?: string }>;
}

export default async function FacultyStudentsPage({ searchParams }: PageProps) {
  const auth = await requirePageRole(["faculty"]);
  const { classId: filterClassId } = await searchParams;

  // A faculty member can see students from two sources:
  //   1. Their homeroom (advised classes)
  //   2. Classes they teach a subject for (via subjects)
  //
  // We collect the unique set of classIds from both sources, then load
  // students per class so the view is grouped/scoped correctly.
  const [advisedClasses, subjects] = await Promise.all([
    listClassesByAdviser(auth.uid),
    listSubjectsByFaculty(auth.uid),
  ]);

  const advisedClassIds = new Set(advisedClasses.map((c) => c.id));
  const taughtClassIds = new Set(subjects.map((s) => s.classId));
  const allClassIds = new Set([...advisedClassIds, ...taughtClassIds]);

  if (allClassIds.size === 0) {
    return (
      <>
        <DashboardPageHeader title="My students" />
        <div className="p-6 sm:p-8">
          <div className="border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="font-serif text-lg text-slate-700">
              No students to show
            </p>
            <p className="mt-1 text-sm text-slate-500">
              You don&apos;t have a homeroom yet and aren&apos;t teaching any
              subjects. Please contact the school administrator.
            </p>
          </div>
        </div>
      </>
    );
  }

  // If filtering, only load that one class; otherwise load all
  const classIdsToLoad = filterClassId
    ? allClassIds.has(filterClassId)
      ? [filterClassId]
      : []
    : [...allClassIds];

  if (filterClassId && classIdsToLoad.length === 0) {
    return (
      <>
        <DashboardPageHeader title="My students" />
        <div className="p-6 sm:p-8">
          <div className="border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            <p className="font-medium">Class not accessible</p>
            <p className="mt-2">
              You don&apos;t have access to this class. You can only see
              students from your homeroom or classes you teach.
            </p>
            <Link
              href="/dashboard/faculty/students"
              className="mt-3 inline-block text-xs font-medium text-rose-900 underline"
            >
              See all my students
            </Link>
          </div>
        </div>
      </>
    );
  }

  // Load class info + students per class in parallel
  const classData = await Promise.all(
    classIdsToLoad.map(
      async (
        id,
      ): Promise<{
        classRecord: ClassRecord | null;
        students: User[];
      }> => {
        const [classRecord, students] = await Promise.all([
          getClass(id),
          listStudentsByClass(id),
        ]);
        return { classRecord, students };
      },
    ),
  );

  // Sort: homeroom first, then by grade level
  classData.sort((a, b) => {
    if (!a.classRecord || !b.classRecord) return 0;
    const aHomeroom = advisedClassIds.has(a.classRecord.id) ? 0 : 1;
    const bHomeroom = advisedClassIds.has(b.classRecord.id) ? 0 : 1;
    if (aHomeroom !== bHomeroom) return aHomeroom - bHomeroom;
    return a.classRecord.gradeLevel - b.classRecord.gradeLevel;
  });

  const totalStudents = classData.reduce(
    (sum, { students }) => sum + students.length,
    0,
  );

  return (
    <>
      <DashboardPageHeader
        title="My students"
        description={
          filterClassId
            ? `Filtered by class · ${totalStudents} student${totalStudents === 1 ? "" : "s"}`
            : `${totalStudents} student${totalStudents === 1 ? "" : "s"} across ${classData.length} class${classData.length === 1 ? "" : "es"}`
        }
        actions={
          filterClassId ? (
            <Link
              href="/dashboard/faculty/students"
              className="inline-flex items-center border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8a85c]"
            >
              Clear filter
            </Link>
          ) : null
        }
      />

      <div className="space-y-8 p-6 sm:p-8">
        {classData.map(({ classRecord, students }) => {
          if (!classRecord) return null;

          const isHomeroom = advisedClassIds.has(classRecord.id);

          return (
            <section
              key={classRecord.id}
              aria-labelledby={`class-${classRecord.id}-heading`}
            >
              <header className="mb-3 flex items-baseline justify-between">
                <div className="flex items-baseline gap-3">
                  <h2
                    id={`class-${classRecord.id}-heading`}
                    className="font-serif text-lg font-semibold text-slate-900"
                  >
                    Grade {classRecord.gradeLevel} - {classRecord.name}
                  </h2>
                  {isHomeroom && (
                    <span className="inline-block border border-[#c8a85c] bg-[#c8a85c]/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-[#5a4a1f]">
                      My homeroom
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {students.length} student{students.length === 1 ? "" : "s"}
                </p>
              </header>

              {students.length === 0 ? (
                <div className="border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                  No students enrolled in this class yet.
                </div>
              ) : (
                <div className="overflow-hidden border border-slate-200 bg-white">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                          Name
                        </th>
                        <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 sm:table-cell">
                          Student no.
                        </th>
                        <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 md:table-cell">
                          Email
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {students.map((student) => (
                        <tr key={student.uid} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-slate-900">
                              {student.displayName}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500 md:hidden">
                              {student.email}
                            </p>
                          </td>
                          <td className="hidden px-4 py-3 font-mono text-sm text-slate-600 sm:table-cell">
                            {student.studentNumber ?? "—"}
                          </td>
                          <td className="hidden px-4 py-3 text-sm text-slate-600 md:table-cell">
                            <a
                              href={`mailto:${student.email}`}
                              className="hover:text-[#0f1f3a] hover:underline"
                            >
                              {student.email}
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
