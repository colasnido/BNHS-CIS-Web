import 'server-only';

import { Timestamp } from 'firebase-admin/firestore';

/**
 * Convert any Firestore-ish date value to an ISO string.
 *
 * Handles all the date shapes that can appear in a doc:
 *   - Firebase Admin Timestamp
 *   - native Date
 *   - epoch number
 *   - duck-typed { toDate(): Date } (client SDK timestamps)
 *   - already-an-ISO-string
 *
 * Returns the fallback (or now) if the value is invalid/missing.
 */
export function toISO(value: unknown, fallback?: string): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'number') return new Date(value).toISOString();

  if (value && typeof value === 'object' && 'toDate' in value) {
    const toDate = (value as { toDate?: () => Date }).toDate;
    if (typeof toDate === 'function') {
      const date = toDate();
      if (!Number.isNaN(date.getTime())) return date.toISOString();
    }
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }

  return fallback ?? new Date().toISOString();
}

/** Convert an ISO string to a Firestore Timestamp. */
export function fromISO(iso: string): Timestamp {
  return Timestamp.fromDate(new Date(iso));
}

/**
 * Build a Firestore update object: only includes fields where input has a defined value.
 * Always includes `updatedAt` set to now.
 *
 * Pass `dateFields` to mark which keys should be converted ISO → Timestamp on write.
 */
export function buildUpdate<T extends Record<string, unknown>>(
  input: Partial<T>,
  dateFields: ReadonlyArray<keyof T> = []
): Record<string, unknown> {
  const updates: Record<string, unknown> = { updatedAt: Timestamp.now() };
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    if (dateFields.includes(key as keyof T) && typeof value === 'string') {
      updates[key] = fromISO(value);
    } else {
      updates[key] = value;
    }
  }
  return updates;
}

/**
 * Recognize Firestore "collection doesn't exist" errors so callers can return
 * empty arrays instead of crashing on a fresh project.
 */
export function isNotFoundError(error: unknown): boolean {
  const e = error as { code?: number; message?: string } | null;
  if (!e) return false;
  return e.code === 5 || Boolean(e.message?.includes('NOT_FOUND'));
}
