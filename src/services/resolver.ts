import 'server-only';

import { listUsersByRole } from '@/services/user.service';
import { listClasses } from '@/services/class.service';
import { normalizePersonName, normalizeSectionName } from '@/lib/normalize';
import type { User } from '@/features/users/types';
import type { ClassRecord } from '@/features/classes/types';

/**
 * Name-based resolution for CSV imports.
 *
 * Per audit decision #6: admins paste names from spreadsheets, not UIDs.
 * Names are inherently fuzzy (partial matches, casing variation), so this
 * module:
 *
 *   1. Tries exact full-name match first (after normalization)
 *   2. Falls back to word-level partial match ("Maria" matches "Maria Santos")
 *   3. Returns ambiguous if multiple candidates match
 *   4. Returns not_found if nothing matches
 *
 * The CSV import handler uses the result to either succeed (single match) or
 * surface a row error with the candidate list so the admin can disambiguate.
 *
 * For performance, callers should fetch the full faculty/class list once
 * outside the loop and call resolveFromList directly. The resolveByName
 * variants below are convenience wrappers for one-off lookups.
 */

export type ResolutionResult<T> =
  | { ok: true; record: T }
  | { ok: false; reason: 'not_found' }
  | { ok: false; reason: 'ambiguous'; matches: T[] };

/**
 * Format a list of resolution failures into a human error message.
 *
 *   resolveFromList for "Maria" with two matches →
 *     "Multiple faculty match \"Maria\": Maria Santos, Maria Reyes — use the full name"
 */
export function formatResolutionError(
  query: string,
  result: { ok: false; reason: 'not_found' | 'ambiguous'; matches?: { displayName?: string; name?: string }[] },
  resourceLabel: string
): string {
  if (result.reason === 'not_found') {
    return `No ${resourceLabel} found matching "${query}"`;
  }
  const names = (result.matches ?? [])
    .map((m) => m.displayName ?? m.name ?? '?')
    .join(', ');
  return `Multiple ${resourceLabel} match "${query}": ${names} — use the full name`;
}

// ---------------------------------------------------------------------------
// Faculty resolution
// ---------------------------------------------------------------------------

/**
 * Resolve a faculty user from a pre-fetched list. This is the hot-path
 * version — callers loading multiple rows should fetch the faculty list once
 * and call this per row.
 */
export function resolveFacultyFromList(
  query: string,
  faculty: readonly User[]
): ResolutionResult<User> {
  const normalizedQuery = normalizePersonName(query);
  if (normalizedQuery === '') {
    return { ok: false, reason: 'not_found' };
  }

  // Pre-normalize all candidate names once — saves N normalizations per row
  // when called in a loop. The caller could memoize this but it's fast enough.
  const candidates = faculty.map((f) => ({
    user: f,
    normalized: normalizePersonName(f.displayName),
  }));

  // Step 1: exact full-name match
  const exact = candidates.filter((c) => c.normalized === normalizedQuery);
  if (exact.length === 1) return { ok: true, record: exact[0].user };
  if (exact.length > 1) {
    return {
      ok: false,
      reason: 'ambiguous',
      matches: exact.map((c) => c.user),
    };
  }

  // Step 2: word-level partial match. "Maria" matches "Maria Santos" because
  // the query is one of the words in the candidate's full name. We don't do
  // substring (e.g. "ari" matching "Maria") because that's too permissive.
  const queryWords = normalizedQuery.split(' ');
  const partial = candidates.filter((c) => {
    const candidateWords = c.normalized.split(' ');
    // Every word of the query must appear as a word in the candidate name.
    // So "Maria Santos" matches "Maria Santos" (degenerate case, already
    // caught by exact), and "Santos" matches "Maria Santos", and
    // "Maria Reyes" does NOT match "Maria Santos" (Reyes isn't there).
    return queryWords.every((qw) => candidateWords.includes(qw));
  });
  if (partial.length === 1) return { ok: true, record: partial[0].user };
  if (partial.length > 1) {
    return {
      ok: false,
      reason: 'ambiguous',
      matches: partial.map((c) => c.user),
    };
  }

  return { ok: false, reason: 'not_found' };
}

/**
 * One-off variant — fetches faculty list and resolves. Use for non-loop
 * callers; in loops, prefer resolveFacultyFromList.
 */
export async function resolveFacultyByName(
  query: string
): Promise<ResolutionResult<User>> {
  const faculty = await listUsersByRole('faculty');
  return resolveFacultyFromList(query, faculty);
}

// ---------------------------------------------------------------------------
// Class resolution
// ---------------------------------------------------------------------------

/**
 * Resolve a class. We match against:
 *   - `name` — the human-readable section name like "St. Augustine"
 *   - `"<name> <section>"` — combined form like "St. Augustine A" (in case
 *     the admin distinguishes Augustine A from Augustine B)
 *
 * Within a school year, class names should be unique. The new createClass
 * enforces that, but for legacy data we still handle ambiguity.
 */
export function resolveClassFromList(
  query: string,
  classes: readonly ClassRecord[]
): ResolutionResult<ClassRecord> {
  const normalizedQuery = normalizeSectionName(query);
  if (normalizedQuery === '') {
    return { ok: false, reason: 'not_found' };
  }

  const candidates = classes.map((c) => ({
    record: c,
    nameNormalized: normalizeSectionName(c.name),
    fullNormalized: normalizeSectionName(`${c.name} ${c.section}`),
  }));

  // Exact match on name OR "name section"
  const exact = candidates.filter(
    (c) =>
      c.nameNormalized === normalizedQuery ||
      c.fullNormalized === normalizedQuery
  );
  if (exact.length === 1) return { ok: true, record: exact[0].record };
  if (exact.length > 1) {
    return {
      ok: false,
      reason: 'ambiguous',
      matches: exact.map((c) => c.record),
    };
  }

  return { ok: false, reason: 'not_found' };
}

export async function resolveClassByName(
  query: string
): Promise<ResolutionResult<ClassRecord>> {
  const classes = await listClasses();
  return resolveClassFromList(query, classes);
}
