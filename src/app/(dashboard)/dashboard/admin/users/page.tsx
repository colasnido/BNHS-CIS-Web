import Link from 'next/link';
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { DeleteButton } from '@/components/dashboard/DeleteButton';
import { listUsers } from '@/services/user.service';
import { listClasses } from '@/services/class.service';

export const metadata = { title: 'Manage users' };
export const dynamic = 'force-dynamic';

const roleStyles = {
  admin: 'border-rose-200 bg-rose-50 text-rose-700',
  faculty: 'border-blue-200 bg-blue-50 text-blue-700',
  student: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

export default async function AdminUsersPage() {
  const [users, classes] = await Promise.all([listUsers(), listClasses()]);
  const classMap = new Map(classes.map((c) => [c.id, c]));

  return (
    <>
      <DashboardPageHeader
        title="Users"
        description="Create and manage faculty, student, and admin accounts."
        actions={
          <Link
            href="/dashboard/admin/users/new"
            className="inline-flex items-center bg-[#0f1f3a] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1a2f5a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8a85c]"
          >
            New user
          </Link>
        }
      />

      <div className="p-6 sm:p-8">
        {users.length === 0 ? (
          <div className="border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="font-serif text-lg text-slate-700">No users yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Add your first faculty, student, or admin account to get started.
            </p>
            <Link
              href="/dashboard/admin/users/new"
              className="mt-4 inline-flex items-center bg-[#0f1f3a] px-4 py-2 text-sm font-semibold text-white"
            >
              New user
            </Link>
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
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Role
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 md:table-cell">
                    Class / Dept
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => {
                  const cls = user.classId ? classMap.get(user.classId) : null;
                  return (
                    <tr key={user.uid} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-900">
                          {user.displayName}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 sm:hidden">
                          {user.email}
                        </p>
                      </td>
                      <td className="hidden px-4 py-3 text-sm text-slate-600 sm:table-cell">
                        {user.email}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block border px-2 py-0.5 text-xs font-medium capitalize ${roleStyles[user.role]}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-sm text-slate-600 md:table-cell">
                        {user.role === 'student' && cls
                          ? `Grade ${cls.gradeLevel} - ${cls.name}`
                          : user.role === 'student' && !cls
                            ? '—'
                            : user.role === 'faculty'
                              ? user.department || '—'
                              : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        <Link
                          href={`/dashboard/admin/users/${user.uid}/edit`}
                          className="text-[#0f1f3a] hover:underline"
                        >
                          Edit
                        </Link>
                        <span className="mx-2 text-slate-300">·</span>
                        <DeleteButton
                          endpoint={`/api/users/${user.uid}`}
                          itemLabel={user.displayName}
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
