/**
 * Central normalization utility.
 *
 * Every `create*` and `update*` function in the service layer runs input
 * through these helpers BEFORE schema validation. This is the only place
 * where string canonicalization happens — call sites pass raw user input.
 *
 * Rules are intentionally conservative:
 *   - We trim and collapse whitespace.
 *   - We title-case names (because "maria santos" and "Maria Santos" should
 *     match for resolution).
 *   - We lowercase emails (because they're case-insensitive identifiers).
 *   - We do NOT auto-correct typos. "St. Agustine" stays "St. Agustine".
 *   - We do NOT touch room names beyond whitespace. "ROOM 1" stays "ROOM 1"
 *     because the admin's casing might be intentional (e.g., posted signs).
 */

/** Collapse all internal runs of whitespace to single spaces, then trim. */
function collapseWhitespace(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Normalize email. Trim and lowercase.
 *
 * Email local-parts are technically case-sensitive per RFC 5321, but in
 * practice no real provider treats them as such, and treating them as
 * case-sensitive here would cause "Jane@bnhs.edu.ph" to be rejected when
 * "jane@bnhs.edu.ph" already exists. Lowercasing wins.
 */
export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

/**
 * Normalize a person's display name: trim, collapse whitespace, title-case
 * each space-separated word. Preserves apostrophes and hyphens within words.
 *
 *   "  maria   dela cruz "  → "Maria Dela Cruz"
 *   "MARIA SANTOS"          → "Maria Santos"
 *   "o'brien"               → "O'Brien"
 *   "anne-marie"            → "Anne-Marie"
 *
 * Does NOT preserve common particles in lowercase ("de la", "von", "van").
 * That'd be locale-dependent and out of scope. If a user wants "Maria dela
 * Cruz" specifically, they'll have to type it that way every time — but
 * since we normalize on read for comparison, "Maria Dela Cruz" and
 * "Maria dela Cruz" still match for resolution purposes.
 */
export function normalizePersonName(input: string): string {
  const collapsed = collapseWhitespace(input);
  return collapsed
    .split(' ')
    .map(titleCaseWord)
    .join(' ');
}

function titleCaseWord(word: string): string {
  if (word.length === 0) return word;
  // Handle hyphenated and apostrophe segments: "anne-marie" → "Anne-Marie",
  // "o'brien" → "O'Brien". We split on these separators, capitalize each
  // segment, and rejoin.
  return word.replace(/([a-zA-ZÀ-ÿ]+)/g, (segment) => {
    return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
  });
}

/**
 * Normalize a room label. Trim and collapse whitespace; nothing else.
 *
 *   "Room  1 "  → "Room 1"
 *   "room1"     → "room1"     (left alone — no auto-rewrite)
 *   "ROOM 1"    → "ROOM 1"    (left alone — admin's casing choice)
 *
 * Per audit decision A9: room labels are admin-curated. We don't second-guess
 * casing or punctuation. We only fix whitespace because "Room 1" and
 * "Room  1" should never count as different rooms in any sane system.
 */
export function normalizeRoomLabel(input: string): string {
  return collapseWhitespace(input);
}

/**
 * Normalize free text — trim, collapse whitespace within each line, but
 * preserve newlines. Used for `description`, `summary`, etc.
 */
export function normalizeFreeText(input: string): string {
  return input
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .trim();
}

/**
 * Normalize a class section name: trim, collapse whitespace, title-case.
 *
 *   "  st. augustine "  → "St. Augustine"
 *   "ST. BENEDICT"      → "St. Benedict"
 *
 * Same rules as person name; separate function so future divergence is easy.
 */
export function normalizeSectionName(input: string): string {
  return normalizePersonName(input);
}

/**
 * Normalize a 24-hour time string to HH:MM with leading zero.
 *
 *   "8:00"   → "08:00"
 *   "08:00"  → "08:00"
 *   "8:0"    → throws — minutes must be MM
 *   "24:00"  → throws — hour must be 00–23
 *
 * We throw rather than coerce because invalid times should fail fast at
 * normalization time, not slip through to schema validation with a confusing
 * downstream error.
 */
export function normalizeTime24(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid time format "${input}" — expected HH:MM (24h)`);
  }
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new Error(`Invalid time "${input}" — hour 0–23, minute 0–59`);
  }
  return `${String(hour).padStart(2, '0')}:${match[2]}`;
}

/**
 * Cheap shorthand for "trim and collapse but otherwise leave it alone".
 * Use for free-form short labels (event titles, announcement titles, etc.)
 * where casing is the author's choice.
 */
export function normalizeShortText(input: string): string {
  return collapseWhitespace(input);
}
