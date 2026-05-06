/**
 * CSV header matching algorithm.
 *
 * Maps incoming CSV column headers to canonical field names using:
 *   1. Normalized exact match against a synonym dictionary (auto-applies)
 *   2. Levenshtein distance for "did you mean?" suggestions (NEVER auto-applies)
 *
 * Why two passes:
 *   - Auto-applying fuzzy matches confuses admins ("Address" → "Adviser"
 *     within edit distance 3 is technically correct but wrong).
 *   - Synonym dictionaries are explicit, predictable, and easy to extend
 *     when a new variant shows up in real-world CSVs.
 */

/** A canonical field on a dataset (e.g., 'studentNumber', 'displayName'). */
export type CanonicalField = string;

/** A header from the user's CSV (e.g., "Student ID", "ID Number"). */
export type SourceHeader = string;

/**
 * Configuration for one canonical field.
 */
export interface FieldConfig {
  /** Canonical name — what the row object will have as its key. */
  key: CanonicalField;
  /** Human-readable label shown in the manual mapping UI. */
  label: string;
  /**
   * Whether this field MUST be mapped before import can proceed.
   * If true, the UI blocks the "Import" button until this field is mapped
   * (either auto-detected or manually selected by the admin).
   */
  required: boolean;
  /**
   * List of accepted header variants. Case- and separator-insensitive
   * matching. Include the canonical name itself plus all known aliases
   * you've seen in the wild.
   *
   * @example ['studentNumber', 'student number', 'student id', 'id', 'lrn']
   */
  aliases: string[];
  /**
   * Optional: a one-line hint shown in the UI explaining what this field is.
   * Useful for fields that aren't self-explanatory (e.g., "LRN: 12-digit
   * Learner Reference Number").
   */
  hint?: string;
}

/** The result of mapping all CSV headers to canonical fields. */
export interface MappingResult {
  /**
   * Map from canonical field key to the source CSV header that supplies it.
   * If a field couldn't be mapped, it's missing from this map.
   */
  mapping: Map<CanonicalField, SourceHeader>;
  /**
   * Required canonical fields that couldn't be auto-mapped. The UI must
   * prompt the admin to map these manually (or accept that they'll be empty).
   */
  unmappedRequired: FieldConfig[];
  /** Source headers that didn't match any canonical field. Safe to ignore. */
  unmatchedHeaders: SourceHeader[];
  /**
   * For each unmapped required field, candidate source headers ranked by
   * edit distance. Used to power "Did you mean?" suggestions in the UI.
   * Key is the canonical field; value is sorted-best-first.
   */
  suggestions: Map<CanonicalField, SuggestionCandidate[]>;
}

export interface SuggestionCandidate {
  header: SourceHeader;
  /** Lower is better. 0 means exact, 1 means one edit away, etc. */
  distance: number;
}

/**
 * Normalize a header for comparison: lowercase, strip non-alphanumeric.
 *
 *   "Student ID"   → "studentid"
 *   "student_id"   → "studentid"
 *   " STUDENT-ID " → "studentid"
 *   "Student #"    → "student"
 */
export function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Levenshtein distance between two strings.
 * Used only for suggestion ranking — not auto-application.
 *
 * Iterative DP version, no recursion. Fine for short header strings.
 */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Two-row DP: previous row and current row.
  const prev: number[] = new Array(b.length + 1);
  const curr: number[] = new Array(b.length + 1);

  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1, // deletion
        curr[j - 1] + 1, // insertion
        prev[j - 1] + cost // substitution
      );
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }

  return prev[b.length];
}

/**
 * Maximum edit distance to consider a "did you mean?" suggestion.
 * 2 catches typos like "studnet"→"student" without matching unrelated
 * fields (e.g. "address" vs "adviser" is distance 3).
 */
const SUGGESTION_THRESHOLD = 2;

/**
 * Map source CSV headers to canonical fields.
 *
 * Pass 1: For each source header, check if its normalized form matches any
 *   alias (also normalized) of any canonical field. If so, mark that field
 *   as mapped. First-come-first-served if two headers match the same field.
 *
 * Pass 2: For each REQUIRED canonical field that's still unmapped, find the
 *   closest unmapped source header by edit distance. If close enough, add
 *   to suggestions (NOT to mapping — admin must approve).
 */
export function autoMapHeaders(
  sourceHeaders: SourceHeader[],
  fields: FieldConfig[]
): MappingResult {
  const mapping = new Map<CanonicalField, SourceHeader>();
  const claimedHeaders = new Set<SourceHeader>();

  // Build alias → field index for O(1) lookup
  const aliasToField = new Map<string, FieldConfig>();
  for (const field of fields) {
    // Always include the canonical key itself as an alias
    const allAliases = [field.key, ...field.aliases];
    for (const alias of allAliases) {
      const normalized = normalizeHeader(alias);
      // First field to claim an alias wins (in case of conflict between
      // configs — shouldn't happen if the configs are well-designed).
      if (!aliasToField.has(normalized)) {
        aliasToField.set(normalized, field);
      }
    }
  }

  // ---------- Pass 1: Auto-map exact (normalized) matches ----------
  for (const header of sourceHeaders) {
    const normalized = normalizeHeader(header);
    const field = aliasToField.get(normalized);
    if (!field) continue;
    if (mapping.has(field.key)) continue; // already mapped from an earlier header

    mapping.set(field.key, header);
    claimedHeaders.add(header);
  }

  // ---------- Pass 2: Suggestions for unmapped required fields ----------
  const suggestions = new Map<CanonicalField, SuggestionCandidate[]>();
  const unmappedRequired: FieldConfig[] = [];
  const unclaimedHeaders = sourceHeaders.filter((h) => !claimedHeaders.has(h));

  for (const field of fields) {
    if (mapping.has(field.key)) continue;
    if (!field.required) continue;

    unmappedRequired.push(field);

    // Find closest unclaimed source headers
    const targets = [field.key, ...field.aliases].map(normalizeHeader);
    const candidates: SuggestionCandidate[] = [];
    for (const header of unclaimedHeaders) {
      const normalized = normalizeHeader(header);
      // Best (smallest) distance to any of this field's targets
      let best = Infinity;
      for (const target of targets) {
        const d = editDistance(normalized, target);
        if (d < best) best = d;
      }
      if (best <= SUGGESTION_THRESHOLD) {
        candidates.push({ header, distance: best });
      }
    }
    candidates.sort((a, b) => a.distance - b.distance);
    if (candidates.length > 0) {
      suggestions.set(field.key, candidates.slice(0, 3));
    }
  }

  return {
    mapping,
    unmappedRequired,
    unmatchedHeaders: unclaimedHeaders,
    suggestions,
  };
}
