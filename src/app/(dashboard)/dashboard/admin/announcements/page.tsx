import Link from 'next/link';
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { DeleteButton } from '@/components/dashboard/DeleteButton';
import { listAnnouncements } from '@/services/announcement.service';

export const metadata = { title: 'Manage announcements' };
export const dynamic = 'force-dynamic';

const priorityStyles = {
  high: 'border-rose-200 bg-rose-50 text-rose-700',
  medium: 'border-amber-200 bg-amber-50 text-amber-700',
  low: 'border-slate-200 bg-slate-50 text-slate-700',
};

export default async function AdminAnnouncementsPage() {
  const announcements = await listAnnouncements();

  return (
    <>
      <DashboardPageHeader
        title="Announcements"
        description="Post school-wide announcements to the public site."
        actions={
          <Link
            href="/dashboard/admin/announcements/new"
            className="inline-flex items-center bg-[#0f1f3a] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1a2f5a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8a85c]"
          >
            New announcement
          </Link>
        }
      />

      <div className="p-6 sm:p-8">
        {announcements.length === 0 ? (
          <div className="border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="font-serif text-lg text-slate-700">No announcements yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Post your first announcement to share with the school community.
            </p>
            <Link
              href="/dashboard/admin/announcements/new"
              className="mt-4 inline-flex items-center bg-[#0f1f3a] px-4 py-2 text-sm font-semibold text-white"
            >
              New announcement
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Title
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 sm:table-cell">
                    Priority
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 md:table-cell">
                    Posted
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 md:table-cell">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {announcements.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-900">{a.title}</p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                        {a.summary}
                      </p>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <span
                        className={`inline-block border px-2 py-0.5 text-xs font-medium capitalize ${priorityStyles[a.priority]}`}
                      >
                        {a.priority}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-sm text-slate-600 md:table-cell">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <span
                        className={`inline-block border px-2 py-0.5 text-xs font-medium ${
                          a.published
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-slate-50 text-slate-500'
                        }`}
                      >
                        {a.published ? 'Visible' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <Link
                        href={`/dashboard/admin/announcements/${a.id}/edit`}
                        className="text-[#0f1f3a] hover:underline"
                      >
                        Edit
                      </Link>
                      <span className="mx-2 text-slate-300">·</span>
                      <DeleteButton
                        endpoint={`/api/announcements/${a.id}`}
                        itemLabel={`"${a.title}"`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
