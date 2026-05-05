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
import type { ClassRecord } from '@/features/classes/types';
import type { User } from '@/features/users/types';

interface ClassesAdminClientProps {
  classes: ClassRecord[];
  faculty: User[];
}

export function ClassesAdminClient({ classes, faculty }: ClassesAdminClientProps) {
  const [importOpen, setImportOpen] = useState(false);
  const facultyMap = new Map(faculty.map((f) => [f.uid, f]));

  // Distinct grade levels for the filter dropdown
  const gradeFilterOptions = [...new Set(classes.map((c) => c.gradeLevel))]
    .sort()
    .map((g) => ({ value: String(g), label: `Grade ${g}` }));

  const columns: Column<ClassRecord>[] = [
    {
      header: 'Class',
      cell: (c) => (
        <span className="font-medium text-slate-900">
          Grade {c.gradeLevel} - {c.name}
        </span>
      ),
      editable: { field: 'name', type: 'text' },
    },
    {
      header: 'Section',
      cell: (c) => <span className="text-slate-600">{c.section}</span>,
      editable: { field: 'section', type: 'text' },
      hideOnMobile: true,
    },
    {
      header: 'School year',
      cell: (c) => <span className="text-slate-600">{c.schoolYear}</span>,
      hideOnTablet: true,
    },
    {
      header: 'Adviser',
      cell: (c) => {
        const adviser = c.adviserId ? facultyMap.get(c.adviserId) : null;
        return adviser ? (
          <span className="text-slate-600">{adviser.displayName}</span>
        ) : (
          <span className="text-amber-600">Not assigned</span>
        );
      },
      hideOnTablet: true,
    },
  ];

  const bulkActions: BulkAction[] = [
    {
      label: 'Delete',
      variant: 'destructive',
      confirm:
        'Delete {n} class(es)? Students assigned to these classes will become unassigned. This cannot be undone.',
      onConfirm: async (ids) => {
        const results = await Promise.allSettled(
          ids.map((id) =>
            fetch(`/api/classes/${id}`, { method: 'DELETE' }).then((r) => {
              if (!r.ok) throw new Error('Failed');
            })
          )
        );
        const failed = results.filter((r) => r.status === 'rejected').length;
        if (failed > 0) throw new Error(`${failed} could not be deleted`);
      },
    },
  ];

  const currentYear = new Date().getFullYear();

  return (
    <>
      <DashboardPageHeader
        title="Classes"
        actions={
          <>
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import CSV
            </button>
            <Link
              href="/dashboard/admin/classes/new"
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New class
            </Link>
          </>
        }
      />

      <div className="px-4 pb-10 sm:px-6">
        <DataTable
          records={classes}
          getKey={(c) => c.id}
          searchFields={(c) => [c.name, c.section, c.schoolYear]}
          searchPlaceholder="Search classes..."
          filters={[
            { key: 'gradeLevel', label: 'Grade', options: gradeFilterOptions },
          ]}
          filterAccessor={(c, key) =>
            String((c as Record<string, unknown>)[key] ?? '')
          }
          columns={columns}
          bulkActions={bulkActions}
          getEditEndpoint={(c) => `/api/classes/${c.id}`}
          rowActions={(c) => (
            <>
              <LinkAction
                href={`/dashboard/admin/classes/${c.id}/edit`}
                label="Edit"
              />
              <DeleteAction
                endpoint={`/api/classes/${c.id}`}
                itemLabel={`Grade ${c.gradeLevel} - ${c.name}`}
              />
            </>
          )}
          emptyTitle="No classes yet"
          emptyMessage="Create your first homeroom section to start enrolling students."
          emptyAction={
            <Link
              href="/dashboard/admin/classes/new"
              className="rounded-md bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              New class
            </Link>
          }
        />
      </div>

      <CSVImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        config={{
          endpoint: '/api/classes/import',
          itemLabel: 'classes',
          requiredColumns: ['name', 'grade_level', 'section', 'school_year'],
          knownColumns: [
            'name',
            'grade_level',
            'section',
            'school_year',
            'adviser_name',
          ],
          templateRows: [
            {
              name: 'St. Augustine',
              grade_level: '7',
              section: 'A',
              school_year: `${currentYear}-${currentYear + 1}`,
              // Audit fix #6: name-based reference, not email.
              // Resolver accepts partial names ("Cruz" matches "Jose Cruz").
              adviser_name: faculty[0]?.displayName ?? '',
            },
            {
              name: 'St. Benedict',
              grade_level: '7',
              section: 'B',
              school_year: `${currentYear}-${currentYear + 1}`,
              adviser_name: '',
            },
          ],
          validateRow: (row) => {
            if (!row.name) return 'Name is required';
            const grade = Number(row.grade_level);
            if (Number.isNaN(grade) || grade < 7 || grade > 12) {
              return 'Grade level must be 7–12';
            }
            if (!row.section) return 'Section is required';
            if (!/^\d{4}-\d{4}$/.test(row.school_year ?? '')) {
              return 'School year must be YYYY-YYYY';
            }
            return null;
          },
        }}
      />
    </>
  );
}
