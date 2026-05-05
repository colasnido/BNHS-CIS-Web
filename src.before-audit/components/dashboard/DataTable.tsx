'use client';

import { useState, useMemo, useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/Toast';

/**
 * DataTable — generic admin table with search, filter, bulk select, and
 * inline edit support.
 *
 * Why generic: every admin page (users, classes, subjects, schedules) has
 * the same shape — list of records, a few searchable string fields, optional
 * filters, optional bulk actions. Building this once means new admin pages
 * are mostly schema + render functions, not boilerplate.
 *
 * Usage example (in an admin page):
 *
 *   <DataTable
 *     records={users}
 *     getKey={(u) => u.uid}
 *     searchFields={(u) => [u.displayName, u.email]}
 *     filters={[{ key: 'role', label: 'Role', options: [...] }]}
 *     columns={[
 *       { header: 'Name', cell: (u) => u.displayName, editable: { ... } },
 *       ...
 *     ]}
 *     bulkActions={[{ label: 'Delete', onConfirm: (ids) => ... }]}
 *     getEditEndpoint={(u) => `/api/users/${u.uid}`}
 *   />
 */

export interface ColumnEditConfig<T> {
  /** What field on the record this column edits */
  field: keyof T & string;
  /** Type of input — defaults to text */
  type?: 'text' | 'select';
  /** For select fields, the available options */
  options?: { value: string; label: string }[];
  /** Optional: validation function returning error message or null */
  validate?: (value: string) => string | null;
}

export interface Column<T> {
  header: string;
  /** What to render in the read-only cell */
  cell: (record: T) => ReactNode;
  /** If set, this column supports inline editing */
  editable?: ColumnEditConfig<T>;
  /** Hide column on mobile */
  hideOnMobile?: boolean;
  /** Hide column on tablet */
  hideOnTablet?: boolean;
  /** Right-align the cell content */
  align?: 'left' | 'right';
  /** Width hint */
  className?: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

export interface BulkAction {
  label: string;
  /** Confirm message — if provided, shows confirm() dialog before running */
  confirm?: string;
  /** Returns an async function that performs the bulk action */
  onConfirm: (ids: string[]) => Promise<void>;
  /** Visual treatment */
  variant?: 'default' | 'destructive';
}

interface DataTableProps<T> {
  records: T[];
  /** Function returning a stable unique key per record (used for selection) */
  getKey: (record: T) => string;
  /** Function returning array of strings to search across */
  searchFields?: (record: T) => string[];
  /** Optional filter dropdowns */
  filters?: FilterConfig[];
  /** For each filter, function that extracts the matchable value from a record */
  filterAccessor?: (record: T, filterKey: string) => string;
  /** Column definitions */
  columns: Column<T>[];
  /** Optional bulk actions — if absent, no select column is shown */
  bulkActions?: BulkAction[];
  /** API endpoint for inline edit PUT (called per record) */
  getEditEndpoint?: (record: T) => string;
  /** Optional: render row-level actions (e.g. Delete button) */
  rowActions?: (record: T) => ReactNode;
  /** Empty state message */
  emptyTitle?: string;
  emptyMessage?: string;
  emptyAction?: ReactNode;
  /** Search input placeholder */
  searchPlaceholder?: string;
}

export function DataTable<T>({
  records,
  getKey,
  searchFields,
  filters = [],
  filterAccessor,
  columns,
  bulkActions = [],
  getEditEndpoint,
  rowActions,
  emptyTitle = 'No records yet',
  emptyMessage = '',
  emptyAction,
  searchPlaceholder = 'Search...',
}: DataTableProps<T>) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Filtered records — search + active filters applied
  const filtered = useMemo(() => {
    let result = records;

    // Apply search
    if (search.trim() && searchFields) {
      const needle = search.trim().toLowerCase();
      result = result.filter((r) =>
        searchFields(r).some((s) => s.toLowerCase().includes(needle))
      );
    }

    // Apply filters
    for (const [key, value] of Object.entries(activeFilters)) {
      if (!value || !filterAccessor) continue;
      result = result.filter((r) => filterAccessor(r, key) === value);
    }

    return result;
  }, [records, search, activeFilters, searchFields, filterAccessor]);

  // Reset selection when filtered list changes (avoid stale selections)
  useEffect(() => {
    if (selectedIds.size === 0) return;
    const visibleIds = new Set(filtered.map(getKey));
    const validSelections = new Set(
      [...selectedIds].filter((id) => visibleIds.has(id))
    );
    if (validSelections.size !== selectedIds.size) {
      setSelectedIds(validSelections);
    }
  }, [filtered, selectedIds, getKey]);

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((r) => selectedIds.has(getKey(r)));

  const toggleAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(getKey)));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Inline edit handlers
  function startEdit(record: T) {
    const id = getKey(record);
    const values: Record<string, string> = {};
    for (const col of columns) {
      if (col.editable) {
        const val = (record as Record<string, unknown>)[col.editable.field];
        values[col.editable.field] = val == null ? '' : String(val);
      }
    }
    setEditingId(id);
    setEditValues(values);
    setEditErrors({});
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValues({});
    setEditErrors({});
  }

  async function saveEdit(record: T) {
    if (!getEditEndpoint) return;

    // Run column-level validation
    const errors: Record<string, string> = {};
    for (const col of columns) {
      if (col.editable?.validate) {
        const val = editValues[col.editable.field] ?? '';
        const err = col.editable.validate(val);
        if (err) errors[col.editable.field] = err;
      }
    }
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(getEditEndpoint(record), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editValues),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Save failed');
      }
      toast.success('Saved');
      setEditingId(null);
      setEditValues({});
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  }

  async function runBulkAction(action: BulkAction) {
    if (selectedIds.size === 0) return;
    if (action.confirm && !confirm(action.confirm.replace('{n}', String(selectedIds.size)))) {
      return;
    }
    try {
      await action.onConfirm([...selectedIds]);
      toast.success(`${action.label} applied to ${selectedIds.size} item${selectedIds.size === 1 ? '' : 's'}`);
      setSelectedIds(new Set());
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bulk action failed');
    }
  }

  const showSelectColumn = bulkActions.length > 0;
  const totalCols =
    columns.length + (showSelectColumn ? 1 : 0) + (rowActions ? 1 : 0);

  // Empty state (no records at all, before any filters)
  if (records.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-base font-medium text-slate-700">{emptyTitle}</p>
        {emptyMessage && (
          <p className="mt-1 text-sm text-slate-500">{emptyMessage}</p>
        )}
        {emptyAction && <div className="mt-4">{emptyAction}</div>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search + filters bar */}
      {(searchFields || filters.length > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          {searchFields && (
            <div className="relative flex-1 min-w-[200px]">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          )}
          {filters.map((f) => (
            <select
              key={f.key}
              value={activeFilters[f.key] ?? ''}
              onChange={(e) =>
                setActiveFilters((prev) => ({ ...prev, [f.key]: e.target.value }))
              }
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">{f.label}: All</option>
              {f.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {f.label}: {opt.label}
                </option>
              ))}
            </select>
          ))}
        </div>
      )}

      {/* Result count when filtered */}
      {(search || Object.values(activeFilters).some(Boolean)) && (
        <p className="text-xs text-slate-500">
          Showing {filtered.length} of {records.length}
        </p>
      )}

      {/* Bulk action bar */}
      {showSelectColumn && selectedIds.size > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm">
          <p className="font-medium text-blue-900">
            {selectedIds.size} selected
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-xs font-medium text-blue-700 hover:text-blue-900"
            >
              Clear
            </button>
            {bulkActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => runBulkAction(action)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium shadow-sm transition-colors ${
                  action.variant === 'destructive'
                    ? 'bg-rose-600 text-white hover:bg-rose-700'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300'
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {showSelectColumn && (
                <th className="w-10 px-3 py-2.5">
                  <input
                    type="checkbox"
                    aria-label="Select all visible rows"
                    checked={allVisibleSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                </th>
              )}
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`px-3 py-2.5 text-${col.align ?? 'left'} text-xs font-semibold uppercase tracking-wider text-slate-600 ${
                    col.hideOnMobile ? 'hidden sm:table-cell' : ''
                  } ${col.hideOnTablet ? 'hidden md:table-cell' : ''} ${col.className ?? ''}`}
                >
                  {col.header}
                </th>
              ))}
              {rowActions && (
                <th className="w-32 px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={totalCols}
                  className="px-4 py-12 text-center text-sm text-slate-500"
                >
                  No matches. Try a different search or filter.
                </td>
              </tr>
            ) : (
              filtered.map((record) => {
                const id = getKey(record);
                const isEditing = editingId === id;
                const isSelected = selectedIds.has(id);
                return (
                  <tr
                    key={id}
                    className={`${isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50'} ${isEditing ? 'bg-amber-50/40' : ''}`}
                  >
                    {showSelectColumn && (
                      <td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          aria-label={`Select row ${id}`}
                          checked={isSelected}
                          onChange={() => toggleOne(id)}
                          disabled={isEditing}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                    )}
                    {columns.map((col, i) => (
                      <td
                        key={i}
                        className={`px-3 py-2.5 text-sm text-${col.align ?? 'left'} ${
                          col.hideOnMobile ? 'hidden sm:table-cell' : ''
                        } ${col.hideOnTablet ? 'hidden md:table-cell' : ''}`}
                      >
                        {isEditing && col.editable ? (
                          <InlineEditCell
                            config={col.editable}
                            value={editValues[col.editable.field] ?? ''}
                            onChange={(v) =>
                              setEditValues((prev) => ({
                                ...prev,
                                [col.editable!.field]: v,
                              }))
                            }
                            error={editErrors[col.editable.field]}
                          />
                        ) : (
                          col.cell(record)
                        )}
                      </td>
                    ))}
                    {rowActions && (
                      <td className="px-3 py-2.5 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => saveEdit(record)}
                              disabled={isSaving}
                              className="rounded-md bg-blue-600 px-2.5 py-1 font-medium text-white hover:bg-blue-700 disabled:bg-slate-400"
                            >
                              {isSaving ? '…' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              disabled={isSaving}
                              className="text-slate-600 hover:text-slate-900"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-3 text-xs">
                            {getEditEndpoint &&
                              columns.some((c) => c.editable) && (
                                <button
                                  type="button"
                                  onClick={() => startEdit(record)}
                                  className="font-medium text-blue-600 hover:text-blue-800"
                                >
                                  Quick edit
                                </button>
                              )}
                            {rowActions(record)}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InlineEditCell<T>({
  config,
  value,
  onChange,
  error,
}: {
  config: ColumnEditConfig<T>;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const baseInputClass =
    'w-full rounded border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

  if (config.type === 'select' && config.options) {
    return (
      <div>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClass}
        >
          {config.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-0.5 text-[11px] text-rose-600">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={baseInputClass}
      />
      {error && <p className="mt-0.5 text-[11px] text-rose-600">{error}</p>}
    </div>
  );
}

/**
 * Convenience component for the "row delete" pattern, used as rowActions
 * input alongside other actions.
 */
export function DeleteAction({
  endpoint,
  itemLabel,
  onSuccess,
}: {
  endpoint: string;
  itemLabel: string;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete ${itemLabel}? This cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      const res = await fetch(endpoint, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Delete failed');
      }
      toast.success('Deleted');
      onSuccess?.();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
      setIsDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="font-medium text-rose-600 hover:text-rose-800 disabled:text-slate-400"
    >
      {isDeleting ? '…' : 'Delete'}
    </button>
  );
}

/**
 * Standalone link-styled action for use inside rowActions (e.g., "Edit" link
 * to a full edit page when inline edit isn't enough).
 */
export function LinkAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="font-medium text-slate-600 hover:text-slate-900"
    >
      {label}
    </Link>
  );
}
