'use client';

/**
 * Tiny toast system. No third-party deps. Shows transient feedback messages
 * after inline edits, bulk actions, CSV imports, etc.
 *
 * Usage:
 *   1. Mount <Toaster /> once in the dashboard layout
 *   2. From any client component: import { toast } and call toast.success("Saved")
 */

import { useEffect, useState } from 'react';

type ToastKind = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

// Simple pub/sub — no React Context needed because the Toaster is a singleton
const listeners = new Set<(toasts: Toast[]) => void>();
let toastsState: Toast[] = [];
let nextId = 0;

function emit() {
  for (const l of listeners) l(toastsState);
}

function push(kind: ToastKind, message: string) {
  const id = nextId++;
  toastsState = [...toastsState, { id, kind, message }];
  emit();
  // Auto-dismiss after 3.5s
  setTimeout(() => {
    toastsState = toastsState.filter((t) => t.id !== id);
    emit();
  }, 3500);
}

export const toast = {
  success: (msg: string) => push('success', msg),
  error: (msg: string) => push('error', msg),
  info: (msg: string) => push('info', msg),
};

const KIND_STYLES: Record<ToastKind, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-rose-200 bg-rose-50 text-rose-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
};

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`min-w-[260px] max-w-md border px-4 py-3 text-sm shadow-sm ${KIND_STYLES[t.kind]}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
