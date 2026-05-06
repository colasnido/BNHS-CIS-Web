'use client';

import { useState, useMemo, useRef, type ChangeEvent } from 'react';
import Papa from 'papaparse';
import {
  autoMapHeaders,
  type MappingResult,
  type SourceHeader,
  type CanonicalField,
} from '@/lib/csv/matcher';
import type {
  ImportConfig,
  ImportApiResponse,
} from '@/lib/csv/import-config';

/**
 * Shared CSV import dialog.
 *
 * Parameterized by an ImportConfig — used the same way for users, schedules,
 * subjects, classes. The UI flow is:
 *
 *   1. UPLOAD   — file picker. PapaParse reads the file in browser memory.
 *   2. MAPPING  — show auto-detected column mappings + manual overrides
 *                  for unmapped required fields. Show suggestions if any.
 *   3. PREVIEW  — show first 5 normalized rows. Highlights pre-validation
 *                  errors (e.g., bad time format) before submit.
 *   4. SUBMIT   — POST normalized rows to the config's apiEndpoint.
 *   5. RESULT   — show created/failed counts and per-row errors.
 *
 * No round-trip to server until step 4 — admin can iterate on mapping freely.
 */

type DialogStep = 'upload' | 'mapping' | 'submitting' | 'result';

const SENTINEL_IGNORE = '__ignore__';

interface CsvImportDialogProps<TRow extends Record<string, unknown>> {
  config: ImportConfig<TRow>;
  /** Called when import completes with at least one success — parent should refresh data. */
  onCompleted?: (response: ImportApiResponse) => void;
  /** Close handler — parent typically removes the dialog. */
  onClose: () => void;
}

interface ParsedCsv {
  headers: SourceHeader[];
  rows: Record<string, string>[];
}

export function CsvImportDialog<TRow extends Record<string, unknown>>({
  config,
  onCompleted,
  onClose,
}: CsvImportDialogProps<TRow>) {
  const [step, setStep] = useState<DialogStep>('upload');
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);

  // mapping is the working state — starts from auto-detection, admin edits it.
  // Map from canonical field key → source header (or SENTINEL_IGNORE).
  const [mapping, setMapping] = useState<Map<CanonicalField, SourceHeader>>(
    new Map()
  );

  // Auto-detected mapping result — kept around so we can show suggestions
  // for unmapped fields.
  const [autoResult, setAutoResult] = useState<MappingResult | null>(null);

  const [submitResult, setSubmitResult] =
    useState<ImportApiResponse | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---------- Upload step ----------
  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError(null);

    // PapaParse handles BOM, quote escaping, mixed line endings.
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      // Trim header whitespace — the matcher normalizes again, but trimming
      // here means the UI shows "Name" not " Name " in the dropdown.
      transformHeader: (h) => h.trim(),
      complete(results) {
        if (results.errors.length > 0) {
          // Surface only fatal errors; warnings are common (e.g. quote count
          // off by one in a single row) and PapaParse recovers.
          const fatal = results.errors.find((err) => err.type !== 'FieldMismatch');
          if (fatal) {
            setParseError(
              `We couldn't read your CSV: ${fatal.message}. Make sure the file is a real CSV (not Excel).`
            );
            return;
          }
        }

        const headers = (results.meta.fields ?? []).filter(Boolean);
        if (headers.length === 0) {
          setParseError(
            'Your file appears to be empty or missing a header row.'
          );
          return;
        }

        const rows = results.data.filter((row) =>
          // Drop fully-empty rows (PapaParse's skipEmptyLines doesn't catch
          // rows that are nothing but commas)
          Object.values(row).some((v) => v?.trim().length > 0)
        );

        if (rows.length === 0) {
          setParseError(
            'Your file has a header row but no data rows. Add at least one row of data.'
          );
          return;
        }

        const result = autoMapHeaders(headers, config.fields);
        setParsed({ headers, rows });
        setMapping(new Map(result.mapping));
        setAutoResult(result);
        setStep('mapping');
      },
      error(err) {
        setParseError(`Failed to read file: ${err.message}`);
      },
    });
  }

  // ---------- Mapping step ----------

  function setFieldMapping(fieldKey: CanonicalField, header: string) {
    setMapping((prev) => {
      const next = new Map(prev);
      if (header === SENTINEL_IGNORE) {
        next.delete(fieldKey);
      } else {
        next.set(fieldKey, header);
      }
      return next;
    });
  }

  /** Required fields that don't have a mapping — block submit. */
  const stillUnmapped = useMemo(() => {
    return config.fields.filter((f) => f.required && !mapping.has(f.key));
  }, [config.fields, mapping]);

  /**
   * Apply the current mapping to every CSV row, then run config.normalizeRow
   * on each. Returns:
   *   - validRows: rows that pass normalization
   *   - rowErrors: rows that fail, with their original CSV line number
   */
  const previewState = useMemo(() => {
    if (!parsed) return null;
    if (stillUnmapped.length > 0) return null; // can't preview yet

    const validRows: TRow[] = [];
    const rowErrors: { row: number; error: string }[] = [];

    for (let i = 0; i < parsed.rows.length; i++) {
      const sourceRow = parsed.rows[i];
      // Build the canonical-keyed row by walking the mapping
      const canonical: Record<string, string> = {};
      for (const [fieldKey, sourceHeader] of mapping.entries()) {
        const value = sourceRow[sourceHeader];
        canonical[fieldKey] = value ?? '';
      }
      const result = config.normalizeRow(canonical);
      if (result.ok) {
        validRows.push(result.row);
      } else {
        // CSV line numbers start at 2 (1 = header)
        rowErrors.push({ row: i + 2, error: result.error });
      }
    }

    return { validRows, rowErrors };
  }, [parsed, mapping, stillUnmapped.length, config]);

  // ---------- Submit step ----------
  async function handleSubmit() {
    if (!previewState || previewState.validRows.length === 0) return;

    setStep('submitting');
    setSubmitError(null);

    try {
      const res = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: previewState.validRows }),
      });

      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server returned ${res.status}`);
      }

      const result: ImportApiResponse = await res.json();
      setSubmitResult(result);
      setStep('result');

      if (result.created > 0 && onCompleted) {
        onCompleted(result);
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Import failed unexpectedly'
      );
      setStep('mapping'); // go back so user can try again
    }
  }

  function reset() {
    setStep('upload');
    setParsed(null);
    setMapping(new Map());
    setAutoResult(null);
    setSubmitResult(null);
    setSubmitError(null);
    setParseError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function downloadTemplate() {
    if (!config.templateCsv) return;
    const blob = new Blob([config.templateCsv], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.datasetLabel.toLowerCase()}-template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ============================================================
  // Render
  // ============================================================

  return (
    <div
      role="dialog"
      aria-labelledby="csv-import-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:p-8"
    >
      <div className="w-full max-w-3xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2
            id="csv-import-title"
            className="font-serif text-xl font-semibold text-slate-900"
          >
            Import {config.datasetLabel} from CSV
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8a85c]"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {step === 'upload' && (
            <UploadStep
              parseError={parseError}
              fileInputRef={fileInputRef}
              onFileChange={handleFileChange}
              onDownloadTemplate={config.templateCsv ? downloadTemplate : undefined}
              datasetLabel={config.datasetLabel}
            />
          )}

          {step === 'mapping' && parsed && autoResult && (
            <MappingStep
              parsed={parsed}
              config={config}
              mapping={mapping}
              autoResult={autoResult}
              onChangeMapping={setFieldMapping}
              previewState={previewState}
              stillUnmapped={stillUnmapped}
              submitError={submitError}
              onBack={reset}
              onSubmit={handleSubmit}
            />
          )}

          {step === 'submitting' && (
            <div className="py-12 text-center">
              <p className="font-serif text-lg text-slate-700">
                Importing {config.itemNoun.plural}…
              </p>
              <p className="mt-2 text-sm text-slate-500">
                This usually takes a few seconds.
              </p>
            </div>
          )}

          {step === 'result' && submitResult && (
            <ResultStep
              result={submitResult}
              itemNoun={config.itemNoun}
              onClose={onClose}
              onImportAnother={reset}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Sub-components for each step
// ============================================================

function UploadStep({
  parseError,
  fileInputRef,
  onFileChange,
  onDownloadTemplate,
  datasetLabel,
}: {
  parseError: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onDownloadTemplate?: () => void;
  datasetLabel: string;
}) {
  return (
    <div>
      <p className="text-sm text-slate-600">
        Upload a CSV file with your {datasetLabel.toLowerCase()} data. The
        column names don&apos;t have to match a specific format — we&apos;ll
        try to figure them out automatically.
      </p>

      {parseError && (
        <div
          role="alert"
          className="mt-4 border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
        >
          {parseError}
        </div>
      )}

      <div className="mt-6 border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <input
          ref={fileInputRef}
          id="csv-file-input"
          type="file"
          accept=".csv,text/csv"
          onChange={onFileChange}
          className="sr-only"
        />
        <label
          htmlFor="csv-file-input"
          className="inline-flex cursor-pointer items-center bg-[#0f1f3a] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1a2f5a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8a85c]"
        >
          Choose CSV file
        </label>
        <p className="mt-3 text-xs text-slate-500">
          .csv files only. Excel users: save as &ldquo;CSV (Comma delimited)&rdquo;.
        </p>
      </div>

      {onDownloadTemplate && (
        <p className="mt-4 text-center text-sm text-slate-600">
          Don&apos;t have a CSV yet?{' '}
          <button
            type="button"
            onClick={onDownloadTemplate}
            className="font-medium text-[#0f1f3a] underline hover:text-[#1a2f5a]"
          >
            Download a template
          </button>
        </p>
      )}
    </div>
  );
}

function MappingStep<TRow extends Record<string, unknown>>({
  parsed,
  config,
  mapping,
  autoResult,
  onChangeMapping,
  previewState,
  stillUnmapped,
  submitError,
  onBack,
  onSubmit,
}: {
  parsed: ParsedCsv;
  config: ImportConfig<TRow>;
  mapping: Map<CanonicalField, SourceHeader>;
  autoResult: MappingResult;
  onChangeMapping: (fieldKey: CanonicalField, header: string) => void;
  previewState: {
    validRows: TRow[];
    rowErrors: { row: number; error: string }[];
  } | null;
  stillUnmapped: typeof config.fields;
  submitError: string | null;
  onBack: () => void;
  onSubmit: () => void;
}) {
  // Build the headers-already-claimed set so the dropdowns can hide them
  // from other dropdowns (a header can only map to one field at a time).
  const claimedHeaders = useMemo(
    () => new Set(mapping.values()),
    [mapping]
  );

  return (
    <div>
      {submitError && (
        <div
          role="alert"
          className="mb-4 border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
        >
          {submitError}
        </div>
      )}

      <section>
        <h3 className="font-serif text-base font-semibold text-slate-900">
          Column mapping
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          We detected {autoResult.mapping.size} of {config.fields.length}{' '}
          fields automatically. Review and adjust the unmapped ones below.
        </p>

        <div className="mt-4 divide-y divide-slate-200 border border-slate-200">
          {config.fields.map((field) => {
            const currentMapping = mapping.get(field.key);
            const wasAuto = autoResult.mapping.has(field.key);
            const fieldSuggestions = autoResult.suggestions.get(field.key) ?? [];

            return (
              <div
                key={field.key}
                className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 sm:items-center sm:gap-4"
              >
                <div>
                  <label
                    htmlFor={`map-${field.key}`}
                    className="text-sm font-medium text-slate-900"
                  >
                    {field.label}
                    {field.required && (
                      <span aria-label="required" className="ml-1 text-rose-600">
                        *
                      </span>
                    )}
                  </label>
                  {field.hint && (
                    <p className="text-xs text-slate-500">{field.hint}</p>
                  )}
                </div>

                <div>
                  <select
                    id={`map-${field.key}`}
                    value={currentMapping ?? SENTINEL_IGNORE}
                    onChange={(e) => onChangeMapping(field.key, e.target.value)}
                    className="block w-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#0f1f3a] focus:outline-2 focus:outline-offset-2 focus:outline-[#c8a85c]"
                  >
                    <option value={SENTINEL_IGNORE}>
                      — Not in this file —
                    </option>
                    {parsed.headers.map((h) => {
                      const isClaimedElsewhere =
                        h !== currentMapping && claimedHeaders.has(h);
                      return (
                        <option
                          key={h}
                          value={h}
                          disabled={isClaimedElsewhere}
                        >
                          {h}
                          {isClaimedElsewhere ? ' (used)' : ''}
                        </option>
                      );
                    })}
                  </select>

                  {/* Status indicator */}
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs">
                    {wasAuto && currentMapping && (
                      <span className="text-emerald-700">
                        \u2713 auto-detected
                      </span>
                    )}
                    {!wasAuto && currentMapping && (
                      <span className="text-slate-500">manually mapped</span>
                    )}
                    {!currentMapping && fieldSuggestions.length > 0 && (
                      <span className="text-slate-500">
                        Did you mean:{' '}
                        {fieldSuggestions.map((s, i) => (
                          <span key={s.header}>
                            {i > 0 && ', '}
                            <button
                              type="button"
                              onClick={() => onChangeMapping(field.key, s.header)}
                              className="font-medium text-[#0f1f3a] underline hover:text-[#1a2f5a]"
                            >
                              {s.header}
                            </button>
                          </span>
                        ))}
                        ?
                      </span>
                    )}
                    {!currentMapping &&
                      field.required &&
                      fieldSuggestions.length === 0 && (
                        <span className="text-rose-700">required</span>
                      )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Unmatched columns notice */}
        {autoResult.unmatchedHeaders.length > 0 && (
          <p className="mt-3 text-xs text-slate-500">
            <strong>{autoResult.unmatchedHeaders.length}</strong>{' '}
            column{autoResult.unmatchedHeaders.length === 1 ? '' : 's'} from
            your file{' '}
            {autoResult.unmatchedHeaders.length === 1 ? "wasn't" : "weren't"}{' '}
            recognized and will be ignored:{' '}
            <em>
              {autoResult.unmatchedHeaders
                .filter((h) => !claimedHeaders.has(h))
                .join(', ')}
            </em>
          </p>
        )}
      </section>

      {/* Preview */}
      <section className="mt-6">
        <h3 className="font-serif text-base font-semibold text-slate-900">
          Preview
        </h3>

        {stillUnmapped.length > 0 ? (
          <p className="mt-2 text-sm text-rose-700">
            Map the required field{stillUnmapped.length === 1 ? '' : 's'} above
            to see the preview.
          </p>
        ) : previewState ? (
          <PreviewTable parsed={parsed} previewState={previewState} mapping={mapping} />
        ) : null}
      </section>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onBack}
          className="border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={
            stillUnmapped.length > 0 ||
            !previewState ||
            previewState.validRows.length === 0
          }
          className="bg-[#0f1f3a] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1a2f5a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8a85c] disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          Import{' '}
          {previewState && previewState.validRows.length > 0
            ? `${previewState.validRows.length} row${previewState.validRows.length === 1 ? '' : 's'}`
            : ''}
        </button>
      </div>
    </div>
  );
}

function PreviewTable<TRow extends Record<string, unknown>>({
  parsed,
  previewState,
  mapping,
}: {
  parsed: ParsedCsv;
  previewState: {
    validRows: TRow[];
    rowErrors: { row: number; error: string }[];
  };
  mapping: Map<CanonicalField, SourceHeader>;
}) {
  const sample = previewState.validRows.slice(0, 5);
  const fieldKeys = Array.from(mapping.keys());

  return (
    <div className="mt-3">
      <p className="text-xs text-slate-500">
        Showing {sample.length} of {previewState.validRows.length} valid
        row{previewState.validRows.length === 1 ? '' : 's'}.
        {previewState.rowErrors.length > 0 && (
          <>
            {' '}
            <span className="text-amber-700">
              {previewState.rowErrors.length} row
              {previewState.rowErrors.length === 1 ? '' : 's'} will be skipped.
            </span>
          </>
        )}
      </p>

      {sample.length > 0 && (
        <div className="mt-2 overflow-x-auto border border-slate-200">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-50 text-left">
              <tr>
                {fieldKeys.map((k) => (
                  <th
                    key={k}
                    className="border-b border-slate-200 px-3 py-2 font-medium text-slate-700"
                  >
                    {k}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sample.map((row, i) => (
                <tr key={i} className="bg-white">
                  {fieldKeys.map((k) => (
                    <td
                      key={k}
                      className="border-b border-slate-100 px-3 py-1.5 text-slate-700"
                    >
                      {String(row[k as keyof typeof row] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {previewState.rowErrors.length > 0 && (
        <details className="mt-3 text-xs">
          <summary className="cursor-pointer text-slate-600 hover:text-slate-900">
            Show {previewState.rowErrors.length} skipped row
            {previewState.rowErrors.length === 1 ? '' : 's'}
          </summary>
          <ul className="mt-2 max-h-48 overflow-y-auto border border-slate-200 bg-slate-50 p-3">
            {previewState.rowErrors.slice(0, 50).map((e) => (
              <li key={e.row} className="text-amber-800">
                Row {e.row}: {e.error}
              </li>
            ))}
            {previewState.rowErrors.length > 50 && (
              <li className="text-slate-500">
                … and {previewState.rowErrors.length - 50} more
              </li>
            )}
          </ul>
        </details>
      )}

      <p className="mt-2 text-xs text-slate-500">
        Note: server-side validation may catch additional issues (duplicate
        records, missing classes, etc.) when you click Import.
      </p>
    </div>
  );
}

function ResultStep({
  result,
  itemNoun,
  onClose,
  onImportAnother,
}: {
  result: ImportApiResponse;
  itemNoun: { singular: string; plural: string };
  onClose: () => void;
  onImportAnother: () => void;
}) {
  const totalRows = result.created + result.failed;

  return (
    <div>
      <div
        className={`border p-4 ${
          result.failed === 0
            ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
            : result.created > 0
              ? 'border-amber-200 bg-amber-50 text-amber-900'
              : 'border-rose-200 bg-rose-50 text-rose-900'
        }`}
      >
        <p className="font-serif text-base font-semibold">
          {result.created === totalRows
            ? `Imported ${result.created} ${
                result.created === 1 ? itemNoun.singular : itemNoun.plural
              }.`
            : result.created === 0
              ? `Couldn't import any rows.`
              : `Imported ${result.created} of ${totalRows} ${itemNoun.plural}.`}
        </p>
        {result.failed > 0 && (
          <p className="mt-1 text-sm">
            {result.failed} row{result.failed === 1 ? '' : 's'} could not be
            imported. See details below.
          </p>
        )}
      </div>

      {result.errors.length > 0 && (
        <div className="mt-4 max-h-60 overflow-y-auto border border-slate-200 bg-slate-50 p-3 text-xs">
          <ul className="space-y-1">
            {result.errors.map((e, i) => (
              <li key={i} className="text-slate-700">
                <span className="font-mono text-slate-500">
                  Row {e.row}:
                </span>{' '}
                {e.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onImportAnother}
          className="border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          Import another file
        </button>
        <button
          type="button"
          onClick={onClose}
          className="bg-[#0f1f3a] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1a2f5a]"
        >
          Done
        </button>
      </div>
    </div>
  );
}
