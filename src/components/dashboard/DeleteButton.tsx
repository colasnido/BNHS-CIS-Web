'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DeleteButtonProps {
  /** API endpoint for DELETE request — e.g. /api/events/abc123 */
  endpoint: string;
  /** What's being deleted, e.g. "this event" */
  itemLabel: string;
  /** Where to navigate after successful delete */
  redirectTo?: string;
}

export function DeleteButton({
  endpoint,
  itemLabel,
  redirectTo,
}: DeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm(`Delete ${itemLabel}? This cannot be undone.`)) return;
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(endpoint, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Delete failed');
      }
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      setIsDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="text-xs font-medium text-rose-600 hover:text-rose-700 disabled:text-slate-400"
      >
        {isDeleting ? 'Deleting…' : 'Delete'}
      </button>
      {error && (
        <span role="alert" className="ml-2 text-xs text-rose-600">
          {error}
        </span>
      )}
    </>
  );
}
