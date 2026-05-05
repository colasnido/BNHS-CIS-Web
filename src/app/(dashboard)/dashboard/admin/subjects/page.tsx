import Link from 'next/link';
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { DeleteButton } from '@/components/dashboard/DeleteButton';
import { listSubjects } from '@/services/subject.service';
import { listClasses } from '@/services/class.service';
import { listUsersByRole } from '@/services/user.service';

export const metadata = { title: 'Manage subjects' };
export const dynamic = 'force-dynamic';

export default async function AdminSubjectsPage() {
  const [subjects, classes, faculty] = await Promise.all([
    listSubjects(),
    listClasses(),
    listUsersByRole('faculty'),
  ]);
  const classMap = new Map(classes.map((c) => [c.id, c]));
  const facultyMap = new Map(faculty.map((f) => [f.uid, f]));

  return (
    <>
      <DashboardPageHeader
        title="Subjects"
        description="Assign subjects to classes and teachers."
        actions={
          <Link
            href="/dashboard/admin/subjects/new"
            className="inline-flex items-center bg-[#0f1f3a] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1a2f5a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8a85c]"
          >
            New subject
          </Link>
        }
      />

      <div className="p-6 sm:p-8">
        {subjects.length === 0 ? (
          <div className="border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="font-serif text-lg text-slate-700">No subjects yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Add subjects after you have at least one class and one faculty user.
            </p>
            <Link
              href="/dashboard/admin/subjects/new"
              className="mt-4 inline-flex items-center bg-[#0f1f3a] px-4 py-2 text-sm font-semibold text-white"
            >
              New subject
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Name
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 sm:table-cell">
                    Class
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 md:table-cell">
                    Teacher
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjects.map((s) => {
                  const cls = classMap.get(s.classId);
                  const teacher = facultyMap.get(s.facultyId);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-mono text-sm font-medium text-slate-900">
                          {s.code}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-900">
                          {s.name}
                        </p>
                      </td>
                      <td className="hidden px-4 py-3 text-sm text-slate-600 sm:table-cell">
                        {cls ? `Grade ${cls.gradeLevel} - ${cls.name}` : '—'}
                      </td>
                      <td className="hidden px-4 py-3 text-sm text-slate-600 md:table-cell">
                        {teacher?.displayName ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        <Link
                          href={`/dashboard/admin/subjects/${s.id}/edit`}
                          className="text-[#0f1f3a] hover:underline"
                        >
                          Edit
                        </Link>
                        <span className="mx-2 text-slate-300">·</span>
                        <DeleteButton
                          endpoint={`/api/subjects/${s.id}`}
                          itemLabel={`"${s.name}"`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
