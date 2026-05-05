'use client';

import {
  useState,
  useMemo,
  useRef,
  type ChangeEvent,
  type DragEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import { parseCSVAsObjects } from '@/lib/csv';
import { toast } from '@/components/ui/Toast';

/**
 * Per-resource configuration for the CSV import flow.
 *
 * The validation lives client-side intentionally: it lets us show errors
 * immediately during preview without a network round-trip, and the import
 * endpoint already does its own server-side validation when calling
 * createUser / createClass / etc., so the client check is just a fast first
 * pass — not a security boundary.
 */
export interface CSVImportConfig {
  /** API endpoint that accepts { rows: ParsedRow[] } and creates records. */
  endpoint: string;
  /** Plural label, e.g. "users", "classes" — used in confirmation copy. */
  itemLabel: string;
  /** Column names that MUST be present + non-empty per row. */
  requiredColumns: string[];
  /** All columns the importer recognizes. Extras trigger a friendly warning. */
  knownColumns: string[];
  /** Sample rows used to build the downloadable template CSV. */
  templateRows: Record<string, string>[];
  /** Per-row validator. Returns an error message, or null if the row is OK. */
  validateRow: (row: Record<string, string>) => string | null;
}

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CSVImportConfig;
}

interface ParsedPreview {
  headers: string[];
  rows: Record<string, string>[];
  /** Per-row error message (same length as rows; null = valid). */
  rowErrors: (string | null)[];
  /** Headers in the file that the importer doesn't recognize. */
  unknownColumns: string[];
  /** Required columns missing from the header row. */
  missingRequired: string[];
}

/**
 * Build the downloadable CSV template from the configured sample rows.
 *
 * Quoting: standard CSV — fields containing commas, quotes, or newlines get
 * wrapped in double quotes; embedded quotes are doubled. Plain values pass
 * through untouched so the file diffs cleanly with hand-edited versions.
 */
function buildTemplateCSV(config: CSVImportConfig): string {
  const headers = config.knownColumns;
  const escape = (val: string): string => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };
  const rows = [headers.map(escape).join(',')];
  for (const sample of config.templateRows) {
    rows.push(headers.map((h) => escape(sample[h] ?? '')).join(','));
  }
  return rows.join('\n');
}

/**
 * CSV import modal — two-step flow:
 *
 *   1. Validate step:  user pastes CSV or uploads a file → we parse client-side,
 *      run config.validateRow on each row, and show a preview table with
 *      per-row error annotations.
 *
 *   2. Import step:  user clicks "Import N rows", we POST only the valid rows
 *      to config.endpoint. The endpoint creates records and returns
 *      { created, failed, errors }. We surface the result via toast.
 *
 * Why client-side parsing/validation: feedback is instant, and the import
 * endpoint already validates again when it calls the underlying service
 * (createUser, etc.), so this is purely a UX accelerator — not a security
 * boundary.
 *
 * Why both file upload AND paste: the realistic admin workflow is "I have a
 * student list in Google Sheets". Paste-from-clipboard handles that without
 * an export step; file upload handles the case where the file already exists.
 */
export function CSVImportModal({
  isOpen,
  onClose,
  config,
}: CSVImportModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvText, setCsvText] = useState('');
  const [preview, setPreview] = useState<ParsedPreview | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Reset everything when the modal closes so reopening starts fresh.
  function handleClose() {
    if (isImporting) return;
    setCsvText('');
    setPreview(null);
    onClose();
  }

  const validRowCount = useMemo(
    () => preview?.rowErrors.filter((e) => e === null).length ?? 0,
    [preview]
  );
  const errorCount = useMemo(
    () => preview?.rowErrors.filter((e) => e !== null).length ?? 0,
    [preview]
  );

  /**
   * Parse the current csvText with the lib parser, then run the per-resource
   * validator over each row. Header-level checks (missing required columns,
   * unknown columns) come from the parsed headers.
   */
  function validate() {
    if (!csvText.trim()) {
      toast.error('Paste CSV content or upload a file first');
      return;
    }
    const { headers, data } = parseCSVAsObjects(csvText);

    if (headers.length === 0 || data.length === 0) {
      toast.error('CSV is empty or has no data rows');
      return;
    }

    const missingRequired = config.requiredColumns.filter(
      (c) => !headers.includes(c)
    );
    const unknownColumns = headers.filter(
      (h) => !config.knownColumns.includes(h)
    );

    const rowErrors = data.map((row) => {
      // First check required-column-non-empty for this row.
      for (const required of config.requiredColumns) {
        if (!row[required] || row[required].trim() === '') {
          return `${required} is required`;
        }
      }
      return config.validateRow(row);
    });

    setPreview({
      headers,
      rows: data,
      rowErrors,
      unknownColumns,
      missingRequired,
    });
  }

  /**
   * POST the valid rows to the import endpoint. The server is responsible for
   * actually creating the records and returns a summary. We translate that
   * summary into a toast and refresh the page.
   */
  async function commit() {
    if (!preview) return;
    const validRows = preview.rows.filter(
      (_, idx) => preview.rowErrors[idx] === null
    );
    if (validRows.length === 0) {
      toast.error('No valid rows to import');
      return;
    }

    setIsImporting(true);
    try {
      const res = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: validRows }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        created?: number;
        failed?: number;
        errors?: { row: number; message: string }[];
        error?: string;
      };

      if (!res.ok) {
        toast.error(body.error ?? 'Import failed');
        return;
      }

      const created = body.created ?? 0;
      const failed = body.failed ?? 0;
      if (failed === 0) {
        toast.success(`Imported ${created} ${config.itemLabel}`);
      } else {
        toast.error(
          `Imported ${created}, ${failed} failed. First error: ${body.errors?.[0]?.message ?? 'unknown'}`
        );
      }

      handleClose();
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Import failed';
      toast.error(msg);
    } finally {
      setIsImporting(false);
    }
  }

  function downloadTemplate() {
    const csv = buildTemplateCSV(config);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.itemLabel}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      toast.error('Please upload a .csv file');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCsvText(String(reader.result ?? ''));
      setPreview(null);
    };
    reader.onerror = () => toast.error('Could not read file');
    reader.readAsText(file);
  }

  function onFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="csv-import-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        aria-hidden="true"
        onClick={handleClose}
        className="absolute inset-0 bg-slate-900/50"
      />

      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2
              id="csv-import-title"
              className="text-lg font-semibold capitalize text-slate-900"
            >
              Import {config.itemLabel} from CSV
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Upload a file or paste rows from a spreadsheet.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isImporting}
            aria-label="Close"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!preview ? (
            <div className="space-y-5">
              {/* Expected columns + template download */}
              <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Expected columns
                  </p>
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="text-xs font-medium text-blue-700 hover:underline"
                  >
                    ↓ Download template
                  </button>
                </div>
                <ul className="mt-2 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
                  {config.knownColumns.map((col) => (
                    <li key={col} className="flex items-baseline gap-1.5">
                      <code className="font-mono text-[11px] font-medium text-slate-900">
                        {col}
                      </code>
                      {config.requiredColumns.includes(col) && (
                        <span className="text-[10px] font-medium uppercase tracking-wider text-rose-600">
                          required
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* File upload (with drag & drop) */}
              <div>
                <label className="block text-sm font-medium text-slate-900">
                  Upload CSV file
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={onDrop}
                  className={`mt-1.5 rounded-md border-2 border-dashed px-4 py-6 text-center transition-colors ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  <p className="text-sm text-slate-600">
                    Drag a .csv here, or{' '}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="font-medium text-blue-700 hover:underline"
                    >
                      browse
                    </button>
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={onFileInputChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Paste textarea */}
              <div>
                <label
                  htmlFor="csv-paste"
                  className="block text-sm font-medium text-slate-900"
                >
                  …or paste from a spreadsheet
                </label>
                <p className="mt-0.5 text-xs text-slate-500">
                  Copy rows from Google Sheets / Excel. The first row must contain
                  column headers.
                </p>
                <textarea
                  id="csv-paste"
                  rows={6}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={`${config.knownColumns.slice(0, 4).join(',')}\n…`}
                  className="mt-1.5 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-2 focus:outline-offset-2 focus:outline-blue-500"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header-level warnings */}
              {preview.missingRequired.length > 0 && (
                <div
                  role="alert"
                  className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
                >
                  Missing required columns:{' '}
                  <strong>{preview.missingRequired.join(', ')}</strong>
                </div>
              )}
              {preview.unknownColumns.length > 0 && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Unrecognized columns (will be ignored):{' '}
                  <code className="font-mono text-xs">
                    {preview.unknownColumns.join(', ')}
                  </code>
                </div>
              )}

              {/* Counts */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                    Valid
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-emerald-700">
                    {validRowCount}
                  </p>
                </div>
                <div
                  className={`rounded-md border px-4 py-3 ${
                    errorCount > 0
                      ? 'border-rose-200 bg-rose-50'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <p
                    className={`text-xs font-semibold uppercase tracking-wider ${
                      errorCount > 0 ? 'text-rose-700' : 'text-slate-600'
                    }`}
                  >
                    Errors
                  </p>
                  <p
                    className={`mt-1 text-2xl font-semibold ${
                      errorCount > 0 ? 'text-rose-700' : 'text-slate-600'
                    }`}
                  >
                    {errorCount}
                  </p>
                </div>
              </div>

              {/* Per-row preview */}
              <div className="overflow-hidden rounded-md border border-slate-200">
                <div className="max-h-80 overflow-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="sticky top-0 bg-slate-50">
                      <tr>
                        <th className="w-14 px-2 py-2 text-left font-semibold text-slate-600">
                          Row
                        </th>
                        <th className="w-24 px-2 py-2 text-left font-semibold text-slate-600">
                          Status
                        </th>
                        <th className="px-2 py-2 text-left font-semibold text-slate-600">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {preview.rows.map((row, idx) => {
                        const err = preview.rowErrors[idx];
                        return (
                          <tr
                            key={idx}
                            className={err ? 'bg-rose-50/30' : undefined}
                          >
                            <td className="px-2 py-1.5 font-mono text-slate-500">
                              {idx + 2}
                            </td>
                            <td className="px-2 py-1.5">
                              {err ? (
                                <span className="inline-block rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-medium text-rose-700">
                                  Error
                                </span>
                              ) : (
                                <span className="inline-block rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                                  Valid
                                </span>
                              )}
                            </td>
                            <td className="px-2 py-1.5 text-slate-700">
                              {err ? (
                                <span className="text-rose-700">{err}</span>
                              ) : (
                                <span className="text-slate-500">
                                  {Object.entries(row)
                                    .slice(0, 3)
                                    .map(([k, v]) => `${k}=${v}`)
                                    .join(' · ')}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-3">
          {!preview ? (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={validate}
                disabled={!csvText.trim()}
                className="inline-flex h-9 items-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:bg-slate-400"
              >
                Validate
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setPreview(null)}
                disabled={isImporting}
                className="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={commit}
                disabled={isImporting || validRowCount === 0}
                className="inline-flex h-9 items-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:bg-slate-400"
              >
                {isImporting
                  ? 'Importing…'
                  : `Import ${validRowCount} ${config.itemLabel}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
