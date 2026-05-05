import Link from 'next/link';
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { DeleteButton } from '@/components/dashboard/DeleteButton';
import { listEvents } from '@/services/event.service';

export const metadata = { title: 'Manage events' };
export const dynamic = 'force-dynamic';

export default async function AdminEventsPage() {
  const events = await listEvents();

  return (
    <>
      <DashboardPageHeader
        title="Events"
        description="Create, edit, and manage events shown on the public site."
        actions={
          <Link
            href="/dashboard/admin/events/new"
            className="inline-flex items-center bg-[#0f1f3a] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1a2f5a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8a85c]"
          >
            New event
          </Link>
        }
      />

      <div className="p-6 sm:p-8">
        {events.length === 0 ? (
          <div className="border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="font-serif text-lg text-slate-700">No events yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Get started by creating your first event.
            </p>
            <Link
              href="/dashboard/admin/events/new"
              className="mt-4 inline-flex items-center bg-[#0f1f3a] px-4 py-2 text-sm font-semibold text-white"
            >
              New event
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
                    Date
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 md:table-cell">
                    Category
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
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-900">
                        {event.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 sm:hidden">
                        {new Date(event.startDate).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="hidden px-4 py-3 text-sm text-slate-600 sm:table-cell">
                      {new Date(event.startDate).toLocaleDateString()}
                    </td>
                    <td className="hidden px-4 py-3 text-sm capitalize text-slate-600 md:table-cell">
                      {event.category}
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <span
                        className={`inline-block border px-2 py-0.5 text-xs font-medium capitalize ${
                          event.status === 'published' && event.published
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : event.status === 'draft'
                              ? 'border-amber-200 bg-amber-50 text-amber-700'
                              : 'border-slate-200 bg-slate-50 text-slate-700'
                        }`}
                      >
                        {event.published ? event.status : 'hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <Link
                        href={`/dashboard/admin/events/${event.id}/edit`}
                        className="text-[#0f1f3a] hover:underline"
                      >
                        Edit
                      </Link>
                      <span className="mx-2 text-slate-300">·</span>
                      <DeleteButton
                        endpoint={`/api/events/${event.id}`}
                        itemLabel={`"${event.title}"`}
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
