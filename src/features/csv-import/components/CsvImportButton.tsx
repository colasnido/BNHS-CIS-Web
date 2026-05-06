'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CsvImportDialog } from './CsvImportDialog';
import type { ImportConfig } from '@/lib/csv/import-config';

/**
 * CSV import button + dialog launcher.
 *
 * Place anywhere in an admin page header (next to the "New X" button).
 * Refreshes the page on successful import so the new records appear in
 * the list below.
 */
export function CsvImportButton<TRow extends Record<string, unknown>>({
  config,
  /** Optional label override; defaults to "Import CSV". */
  label = 'Import CSV',
}: {
  config: ImportConfig<TRow>;
  label?: string;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8a85c]"
      >
        {label}
      </button>

      {isOpen && (
        <CsvImportDialog
          config={config}
          onClose={() => setIsOpen(false)}
          onCompleted={() => {
            // Refresh server data so the new rows show up in the table
            router.refresh();
          }}
        />
      )}
    </>
  );
}
