'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import {
  DataTable,
  DeleteAction,
  LinkAction,
  type Column,
  type BulkAction,
} from '@/components/dashboard/DataTable';
import { CSVImportModal } from '@/components/dashboard/CSVImportModal';
import type { Subject } from '@/features/subjects/types';
import type { ClassRecord } from '@/features/classes/types';
import type { User } from '@/features/users/types';

interface SubjectsAdminClientProps {
  subjects: Subject[];
  classes: ClassRecord[];
  faculty: User[];
}

/**
 * Audit fixes applied:
 *   - #5 (drop code): Code column removed from table; subject is now identified
 *     by (name, class) within the system
 *   - #6 (CSV uses names): import takes faculty_name + class_section instead
 *     of faculty_email + class_name
 */
export function SubjectsAdminClient({
  subjects,
  classes,
  faculty,
}: SubjectsAdminClientProps) {
  const [importOpen, setImportOpen] = useState(false);
  const classMap = new Map(classes.map((c) => [c.id, c]));
  const facultyMap = new Map(faculty.map((f) => [f.uid, f]));

  const classFilterOptions = classes.map((c) => ({
    value: c.id,
    label: `Grade ${c.gradeLevel} - ${c.name}`,
  }));

  const columns: Column<Subject>[] = [
    {
      header: 'Name',
      cell: (s) => (
        <span className="font-medium text-slate-900">{s.name}</span>
      ),
      editable: { field: 'name', type: 'text' },
    },
    {
      header: 'Class',
      cell: (s) => {
        const cls = classMap.get(s.classId);
        return cls ? (
          <span className="text-slate-600">
            Grade {cls.gradeLevel} - {cls.name}
          </span>
        ) : (
          <span className="text-amber-600">No class</span>
        );
      },
      hideOnMobile: true,
    },
    {
      header: 'Teacher',
      cell: (s) => {
        const teacher = facultyMap.get(s.facultyId);
        return teacher ? (
          <span className="text-slate-600">{teacher.displayName}</span>
        ) : (
          <span className="text-amber-600">No teacher</span>
        );
      },
      hideOnTablet: true,
    },
  ];

  const bulkActions: BulkAction[] = [
    {
      label: 'Delete',
      variant: 'destructive',
      confirm: 'Delete {n} subject(s)? This cannot be undone.',
      onConfirm: async (ids) => {
        const results = await Promise.allSettled(
          ids.map((id) =>
            fetch(`/api/subjects/${id}`, { method: 'DELETE' }).then((r) => {
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
        title="Subjects"
        actions={
          <>
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              Import CSV
            </button>
            <Link
              href="/dashboard/admin/subjects/new"
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New subject
            </Link>
          </>
        }
      />

      <div className="px-4 pb-10 sm:px-6">
        <DataTable
          records={subjects}
          getKey={(s) => s.id}
          searchFields={(s) => [s.name, s.description ?? '']}
          searchPlaceholder="Search subjects..."
          filters={[
            { key: 'classId', label: 'Class', options: classFilterOptions },
          ]}
          filterAccessor={(s, key) => (s as Record<string, string>)[key] ?? ''}
          columns={columns}
          bulkActions={bulkActions}
          getEditEndpoint={(s) => `/api/subjects/${s.id}`}
          rowActions={(s) => (
            <>
              <LinkAction
                href={`/dashboard/admin/subjects/${s.id}/edit`}
                label="Edit"
              />
              <DeleteAction
                endpoint={`/api/subjects/${s.id}`}
                itemLabel={s.name}
              />
            </>
          )}
          emptyTitle="No subjects yet"
          emptyMessage="Add subjects after you have at least one class and one faculty user."
        />
      </div>

      <CSVImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        config={{
          endpoint: '/api/subjects/import',
          itemLabel: 'subjects',
          requiredColumns: ['name', 'class_section', 'faculty_name'],
          knownColumns: [
            'name',
            'class_section',
            'faculty_name',
            'description',
          ],
          templateRows: [
            {
              name: 'Mathematics 7',
              class_section: classes[0]?.name ?? 'St. Augustine',
              faculty_name: faculty[0]?.displayName ?? 'Jane Cruz',
              description: 'Pre-algebra and basic geometry',
            },
          ],
          validateRow: (row) => {
            if (!row.name?.trim()) return 'name is required';
            if (!row.class_section?.trim())
              return 'class_section is required';
            if (!row.faculty_name?.trim())
              return 'faculty_name is required';
            return null;
          },
        }}
      />
    </>
  );
}
