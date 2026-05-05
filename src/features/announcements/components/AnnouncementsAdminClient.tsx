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
import type { Announcement } from '@/features/announcements/types';

interface AnnouncementsAdminClientProps {
  announcements: Announcement[];
}

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const priorityStyles: Record<string, string> = {
  low: 'border-slate-200 bg-slate-50 text-slate-600',
  medium: 'border-blue-200 bg-blue-50 text-blue-700',
  high: 'border-rose-200 bg-rose-50 text-rose-700',
};

export function AnnouncementsAdminClient({
  announcements,
}: AnnouncementsAdminClientProps) {
  const columns: Column<Announcement>[] = [
    {
      header: 'Title',
      cell: (a) => (
        <div>
          <p className="font-medium text-slate-900">{a.title}</p>
          <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 sm:hidden">
            {a.summary}
          </p>
        </div>
      ),
      editable: { field: 'title', type: 'text' },
    },
    {
      header: 'Priority',
      cell: (a) => (
        <span
          className={`inline-block rounded border px-2 py-0.5 text-xs font-medium capitalize ${priorityStyles[a.priority]}`}
        >
          {a.priority}
        </span>
      ),
      editable: {
        field: 'priority',
        type: 'select',
        options: PRIORITY_OPTIONS,
      },
      hideOnMobile: true,
    },
    {
      header: 'Posted',
      cell: (a) => (
        <span className="text-slate-600">
          {new Date(a.createdAt).toLocaleDateString()}
        </span>
      ),
      hideOnTablet: true,
    },
    {
      header: 'Status',
      cell: (a) => (
        <span
          className={`inline-block rounded border px-2 py-0.5 text-xs font-medium ${
            a.published
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-amber-200 bg-amber-50 text-amber-700'
          }`}
        >
          {a.published ? 'Published' : 'Draft'}
        </span>
      ),
    },
  ];

  const bulkActions: BulkAction[] = [
    {
      label: 'Delete',
      variant: 'destructive',
      confirm: 'Delete {n} announcement(s)?',
      onConfirm: async (ids) => {
        const results = await Promise.allSettled(
          ids.map((id) =>
            fetch(`/api/announcements/${id}`, { method: 'DELETE' }).then(
              (r) => {
                if (!r.ok) throw new Error('Failed');
              }
            )
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
        title="Announcements"
        actions={
          <Link
            href="/dashboard/admin/announcements/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New announcement
          </Link>
        }
      />

      <div className="px-4 pb-10 sm:px-6">
        <DataTable
          records={announcements}
          getKey={(a) => a.id}
          searchFields={(a) => [a.title, a.summary]}
          searchPlaceholder="Search announcements..."
          filters={[
            {
              key: 'priority',
              label: 'Priority',
              options: PRIORITY_OPTIONS,
            },
          ]}
          filterAccessor={(a, key) => (a as Record<string, string>)[key] ?? ''}
          columns={columns}
          bulkActions={bulkActions}
          getEditEndpoint={(a) => `/api/announcements/${a.id}`}
          rowActions={(a) => (
            <>
              <LinkAction
                href={`/dashboard/admin/announcements/${a.id}/edit`}
                label="Edit"
              />
              <DeleteAction
                endpoint={`/api/announcements/${a.id}`}
                itemLabel={a.title}
              />
            </>
          )}
          emptyTitle="No announcements yet"
          emptyMessage="Post school-wide updates that students, faculty, and parents will see."
          emptyAction={
            <Link
              href="/dashboard/admin/announcements/new"
              className="rounded-md bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              New announcement
            </Link>
          }
        />
      </div>
    </>
  );
}
