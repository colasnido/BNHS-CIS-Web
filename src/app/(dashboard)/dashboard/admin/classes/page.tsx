import Link from 'next/link';
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { DeleteButton } from '@/components/dashboard/DeleteButton';
import { listClasses } from '@/services/class.service';
import { listUsersByRole } from '@/services/user.service';

export const metadata = { title: 'Manage classes' };
export const dynamic = 'force-dynamic';

export default async function AdminClassesPage() {
  const [classes, faculty] = await Promise.all([
    listClasses(),
    listUsersByRole('faculty'),
  ]);
  const facultyMap = new Map(faculty.map((f) => [f.uid, f]));

  return (
    <>
      <DashboardPageHeader
        title="Classes"
        description="Manage homeroom sections and assign advisers."
        actions={
          <Link
            href="/dashboard/admin/classes/new"
            className="inline-flex items-center bg-[#0f1f3a] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1a2f5a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8a85c]"
          >
            New class
          </Link>
        }
      />

      <div className="p-6 sm:p-8">
        {classes.length === 0 ? (
          <div className="border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="font-serif text-lg text-slate-700">No classes yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Create your first class section to start enrolling students.
            </p>
            <Link
              href="/dashboard/admin/classes/new"
              className="mt-4 inline-flex items-center bg-[#0f1f3a] px-4 py-2 text-sm font-semibold text-white"
            >
              New class
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Class
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 sm:table-cell">
                    Section
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 md:table-cell">
                    School year
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 md:table-cell">
                    Adviser
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classes.map((c) => {
                  const adviser = c.adviserId ? facultyMap.get(c.adviserId) : null;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-900">
                          Grade {c.gradeLevel} - {c.name}
                        </p>
                      </td>
                      <td className="hidden px-4 py-3 text-sm text-slate-600 sm:table-cell">
                        {c.section}
                      </td>
                      <td className="hidden px-4 py-3 text-sm text-slate-600 md:table-cell">
                        {c.schoolYear}
                      </td>
                      <td className="hidden px-4 py-3 text-sm text-slate-600 md:table-cell">
                        {adviser?.displayName ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        <Link
                          href={`/dashboard/admin/classes/${c.id}/edit`}
                          className="text-[#0f1f3a] hover:underline"
                        >
                          Edit
                        </Link>
                        <span className="mx-2 text-slate-300">·</span>
                        <DeleteButton
                          endpoint={`/api/classes/${c.id}`}
                          itemLabel={`Grade ${c.gradeLevel} - ${c.name}`}
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
