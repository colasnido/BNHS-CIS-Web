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
import type { Schedule, DayOfWeek } from '@/features/schedules/types';
import type { Subject } from '@/features/subjects/types';
import type { ClassRecord } from '@/features/classes/types';
import type { User } from '@/features/users/types';

interface SchedulesAdminClientProps {
  schedules: Schedule[];
  subjects: Subject[];
  classes: ClassRecord[];
  faculty: User[];
}

const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

const DAY_OPTIONS: { value: DayOfWeek; label: string }[] = (
  Object.keys(DAY_LABELS) as DayOfWeek[]
).map((d) => ({ value: d, label: DAY_LABELS[d] }));

/**
 * Audit fixes applied to this client:
 *   - #5 (drop code): subject column shows name only, no code
 *   - #6 (CSV uses names): import takes subject_name + class_section
 *     instead of subject_code, with name-based resolver on the backend
 */
export function SchedulesAdminClient({
  schedules,
  subjects,
  classes,
  faculty,
}: SchedulesAdminClientProps) {
  const [importOpen, setImportOpen] = useState(false);
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const classMap = new Map(classes.map((c) => [c.id, c]));
  const facultyMap = new Map(faculty.map((f) => [f.uid, f]));

  const columns: Column<Schedule>[] = [
    {
      header: 'Day',
      cell: (s) => (
        <span className="text-slate-900">{DAY_LABELS[s.dayOfWeek]}</span>
      ),
      editable: { field: 'dayOfWeek', type: 'select', options: DAY_OPTIONS },
    },
    {
      header: 'Time',
      cell: (s) => (
        <span className="font-mono text-sm text-slate-900">
          {s.startTime}–{s.endTime}
        </span>
      ),
    },
    {
      header: 'Subject',
      cell: (s) => {
        const subj = subjectMap.get(s.subjectId);
        return subj ? (
          <span className="text-slate-900">{subj.name}</span>
        ) : (
          <span className="text-amber-600">Unknown subject</span>
        );
      },
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
          <span className="text-slate-400">—</span>
        );
      },
      hideOnMobile: true,
    },
    {
      header: 'Teacher',
      cell: (s) => {
        const t = facultyMap.get(s.facultyId);
        return t ? (
          <span className="text-slate-600">{t.displayName}</span>
        ) : (
          <span className="text-slate-400">—</span>
        );
      },
      hideOnTablet: true,
    },
    {
      header: 'Room',
      cell: (s) => <span className="text-slate-600">{s.room ?? '—'}</span>,
      editable: { field: 'room', type: 'text' },
      hideOnTablet: true,
    },
  ];

  const bulkActions: BulkAction[] = [
    {
      label: 'Delete',
      variant: 'destructive',
      confirm: 'Delete {n} schedule slot(s)?',
      onConfirm: async (ids) => {
        const results = await Promise.allSettled(
          ids.map((id) =>
            fetch(`/api/schedules/${id}`, { method: 'DELETE' }).then((r) => {
              if (!r.ok) throw new Error('Failed');
            })
          )
        );
        const failed = results.filter((r) => r.status === 'rejected').length;
        if (failed > 0) throw new Error(`${failed} could not be deleted`);
      },
    },
  ];

  // Pick a sensible template subject + class section. We use the first subject
  // and look up its class so the template row is internally consistent.
  const templateSubject = subjects[0];
  const templateClass = templateSubject
    ? classMap.get(templateSubject.classId)
    : null;

  return (
    <>
      <DashboardPageHeader
        title="Schedules"
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
              href="/dashboard/admin/schedules/new"
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
              New schedule
            </Link>
          </>
        }
      />

      <div className="px-4 pb-10 sm:px-6">
        <DataTable
          records={schedules}
          getKey={(s) => s.id}
          searchFields={(s) => {
            const subj = subjectMap.get(s.subjectId);
            const cls = classMap.get(s.classId);
            const t = facultyMap.get(s.facultyId);
            return [
              subj?.name ?? '',
              cls?.name ?? '',
              t?.displayName ?? '',
              s.room ?? '',
            ];
          }}
          searchPlaceholder="Search by subject, class, teacher, or room..."
          filters={[{ key: 'dayOfWeek', label: 'Day', options: DAY_OPTIONS }]}
          filterAccessor={(s, key) => (s as Record<string, string>)[key] ?? ''}
          columns={columns}
          bulkActions={bulkActions}
          getEditEndpoint={(s) => `/api/schedules/${s.id}`}
          rowActions={(s) => (
            <>
              <LinkAction
                href={`/dashboard/admin/schedules/${s.id}/edit`}
                label="Edit"
              />
              <DeleteAction
                endpoint={`/api/schedules/${s.id}`}
                itemLabel="this schedule slot"
              />
            </>
          )}
          emptyTitle="No schedules yet"
          emptyMessage="Add weekly meeting times after you have subjects set up."
        />
      </div>

      <CSVImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        config={{
          endpoint: '/api/schedules/import',
          itemLabel: 'schedules',
          requiredColumns: [
            'subject_name',
            'class_section',
            'day_of_week',
            'start_time',
            'end_time',
          ],
          knownColumns: [
            'subject_name',
            'class_section',
            'day_of_week',
            'start_time',
            'end_time',
            'room',
          ],
          templateRows: [
            {
              subject_name: templateSubject?.name ?? 'Mathematics 7',
              class_section: templateClass?.name ?? 'St. Augustine',
              day_of_week: 'mon',
              start_time: '08:00',
              end_time: '09:00',
              room: 'Room 201',
            },
            {
              subject_name: templateSubject?.name ?? 'Mathematics 7',
              class_section: templateClass?.name ?? 'St. Augustine',
              day_of_week: 'wed',
              start_time: '08:00',
              end_time: '09:00',
              room: 'Room 201',
            },
          ],
          validateRow: (row) => {
            if (!row.subject_name?.trim()) return 'subject_name is required';
            if (!row.class_section?.trim())
              return 'class_section is required';
            const day = row.day_of_week?.trim().toLowerCase();
            if (
              !day ||
              !['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].includes(day)
            ) {
              return 'day_of_week must be mon, tue, wed, thu, fri, sat, or sun';
            }
            if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(row.start_time ?? '')) {
              return 'start_time must be HH:MM (24h)';
            }
            if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(row.end_time ?? '')) {
              return 'end_time must be HH:MM (24h)';
            }
            if ((row.start_time ?? '') >= (row.end_time ?? '')) {
              return 'end_time must be after start_time';
            }
            return null;
          },
        }}
      />
    </>
  );
}
