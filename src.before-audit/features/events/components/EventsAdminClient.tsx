'use client';

import Link from 'next/link';
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import {
  DataTable,
  DeleteAction,
  LinkAction,
  type Column,
  type BulkAction,
} from '@/components/dashboard/DataTable';
import type { Event } from '@/features/events/types';

interface EventsAdminClientProps {
  events: Event[];
}

const CATEGORY_OPTIONS = [
  { value: 'academic', label: 'Academic' },
  { value: 'sports', label: 'Sports' },
  { value: 'arts', label: 'Arts' },
  { value: 'assembly', label: 'Assembly' },
  { value: 'community', label: 'Community' },
  { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

export function EventsAdminClient({ events }: EventsAdminClientProps) {
  const columns: Column<Event>[] = [
    {
      header: 'Title',
      cell: (e) => (
        <span className="font-medium text-slate-900">{e.title}</span>
      ),
      editable: { field: 'title', type: 'text' },
    },
    {
      header: 'Date',
      cell: (e) => (
        <span className="text-slate-600">
          {new Date(e.startDate).toLocaleDateString()}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      header: 'Location',
      cell: (e) => <span className="text-slate-600">{e.location}</span>,
      editable: { field: 'location', type: 'text' },
      hideOnMobile: true,
    },
    {
      header: 'Category',
      cell: (e) => (
        <span className="text-slate-600 capitalize">{e.category}</span>
      ),
      editable: {
        field: 'category',
        type: 'select',
        options: CATEGORY_OPTIONS,
      },
      hideOnTablet: true,
    },
    {
      header: 'Status',
      cell: (e) => {
        const styles =
          e.status === 'published' && e.published
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : e.status === 'draft'
              ? 'border-amber-200 bg-amber-50 text-amber-700'
              : 'border-slate-200 bg-slate-50 text-slate-600';
        return (
          <span
            className={`inline-block rounded border px-2 py-0.5 text-xs font-medium capitalize ${styles}`}
          >
            {e.published ? e.status : 'hidden'}
          </span>
        );
      },
      editable: { field: 'status', type: 'select', options: STATUS_OPTIONS },
      hideOnTablet: true,
    },
  ];

  const bulkActions: BulkAction[] = [
    {
      label: 'Delete',
      variant: 'destructive',
      confirm: 'Delete {n} event(s)?',
      onConfirm: async (ids) => {
        const results = await Promise.allSettled(
          ids.map((id) =>
            fetch(`/api/events/${id}`, { method: 'DELETE' }).then((r) => {
              if (!r.ok) throw new Error('Failed');
            })
          )
        );
        const failed = results.filter((r) => r.status === 'rejected').length;
        if (failed > 0) throw new Error(`${failed} could not be deleted`);
      },
    },
  ];

  return (
    <>
      <DashboardPageHeader
        title="Events"
        actions={
          <Link
            href="/dashboard/admin/events/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New event
          </Link>
        }
      />

      <div className="px-4 pb-10 sm:px-6">
        <DataTable
          records={events}
          getKey={(e) => e.id}
          searchFields={(e) => [e.title, e.location, e.description]}
          searchPlaceholder="Search events..."
          filters={[
            { key: 'category', label: 'Category', options: CATEGORY_OPTIONS },
            { key: 'status', label: 'Status', options: STATUS_OPTIONS },
          ]}
          filterAccessor={(e, key) => (e as Record<string, string>)[key] ?? ''}
          columns={columns}
          bulkActions={bulkActions}
          getEditEndpoint={(e) => `/api/events/${e.id}`}
          rowActions={(e) => (
            <>
              <LinkAction
                href={`/dashboard/admin/events/${e.id}/edit`}
                label="Edit"
              />
              <DeleteAction
                endpoint={`/api/events/${e.id}`}
                itemLabel={e.title}
              />
            </>
          )}
          emptyTitle="No events yet"
          emptyMessage="Create your first event to publish on the school site."
          emptyAction={
            <Link
              href="/dashboard/admin/events/new"
              className="rounded-md bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              New event
            </Link>
          }
        />
      </div>
    </>
  );
}
