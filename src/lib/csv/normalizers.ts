/**
 * Per-type value normalizers.
 *
 * Each normalizer takes a raw string from the CSV cell and converts it to
 * the canonical form expected by the schema. Returns null when the input
 * is unrecognized — the row will fail Zod validation later, which is the
 * right outcome (server rejects bad data with a clear error).
 *
 * These are intentionally LIBERAL on input. "Mon", "Monday", "MONDAY",
 * "monday " all map to "mon". The schema is strict, but the door at the
 * front is wide.
 */

// ============================================================================
// Days of the week
// ============================================================================

const DAY_MAP: Record<string, string> = {
  // 3-letter canonical (matches your DAYS_OF_WEEK constant)
  mon: 'mon',
  tue: 'tue',
  wed: 'wed',
  thu: 'thu',
  fri: 'fri',
  sat: 'sat',
  sun: 'sun',
  // Full names
  monday: 'mon',
  tuesday: 'tue',
  wednesday: 'wed',
  thursday: 'thu',
  friday: 'fri',
  saturday: 'sat',
  sunday: 'sun',
  // Common variations
  mo: 'mon',
  tu: 'tue',
  we: 'wed',
  th: 'thu',
  fr: 'fri',
  sa: 'sat',
  su: 'sun',
  tues: 'tue',
  thurs: 'thu',
};

export function normalizeDay(raw: string): string | null {
  const key = raw.trim().toLowerCase().replace(/[^a-z]/g, '');
  return DAY_MAP[key] ?? null;
}

// ============================================================================
// Time (returns 24-hour HH:MM or null)
// ============================================================================

/**
 * Parse a time string into HH:MM 24-hour format.
 *
 * Accepts:
 *   "08:00", "8:00", "8am", "8:30 am", "8:30AM", "08:30:00",
 *   "20:00", "8pm", "8:00 PM"
 *
 * Returns null on unparseable input.
 */
export function normalizeTime(raw: string): string | null {
  const cleaned = raw.trim().toLowerCase();
  if (!cleaned) return null;

  // Detect AM/PM suffix
  let isPm = false;
  let isAm = false;
  let body = cleaned;
  if (cleaned.endsWith('pm') || cleaned.endsWith('p.m.') || cleaned.endsWith('p.m')) {
    isPm = true;
    body = cleaned.replace(/p\.?m\.?$/, '').trim();
  } else if (
    cleaned.endsWith('am') ||
    cleaned.endsWith('a.m.') ||
    cleaned.endsWith('a.m')
  ) {
    isAm = true;
    body = cleaned.replace(/a\.?m\.?$/, '').trim();
  }

  // Now `body` is something like "8", "8:30", "08:30", "8:30:00"
  const match = body.match(/^(\d{1,2})(?::(\d{2}))?(?::\d{2})?$/);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = match[2] ? parseInt(match[2], 10) : 0;

  if (isNaN(hour) || isNaN(minute)) return null;
  if (minute < 0 || minute > 59) return null;

  // Apply AM/PM
  if (isPm && hour < 12) hour += 12;
  if (isAm && hour === 12) hour = 0;
  if (!isAm && !isPm && hour > 24) return null;

  if (hour < 0 || hour > 23) return null;

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

// ============================================================================
// Role (admin / faculty / student) — synonym tolerant
// ============================================================================

const ROLE_MAP: Record<string, 'admin' | 'faculty' | 'student'> = {
  admin: 'admin',
  administrator: 'admin',
  administrative: 'admin',
  faculty: 'faculty',
  teacher: 'faculty',
  instructor: 'faculty',
  professor: 'faculty',
  staff: 'faculty',
  student: 'student',
  pupil: 'student',
  learner: 'student',
};

export function normalizeRole(raw: string): 'admin' | 'faculty' | 'student' | null {
  const key = raw.trim().toLowerCase();
  return ROLE_MAP[key] ?? null;
}

// ============================================================================
// Email — lowercase + trim
// ============================================================================

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

// ============================================================================
// Person name — trim, collapse whitespace, title case
// ============================================================================

export function normalizePersonName(raw: string): string {
  const cleaned = raw.trim().replace(/\s+/g, ' ');
  if (!cleaned) return '';
  // Title-case each word, but preserve all-caps words longer than 1 char
  // (e.g. "Maria DELOS Reyes" → "Maria Delos Reyes")
  return cleaned
    .split(' ')
    .map((word) => {
      if (word.length === 0) return word;
      // Handle hyphenated names like "smith-jones"
      return word
        .split('-')
        .map(
          (part) =>
            part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        )
        .join('-');
    })
    .join(' ');
}

// ============================================================================
// Generic free text — trim, collapse whitespace
// ============================================================================

export function normalizeFreeText(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

// ============================================================================
// Grade level — number 7-12
// ============================================================================

export function normalizeGradeLevel(raw: string): number | null {
  // Accept "7", "Grade 7", "Gr.7", "7th", "G7"
  const match = raw.match(/(\d+)/);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  if (isNaN(n)) return null;
  if (n < 7 || n > 12) return null;
  return n;
}

// ============================================================================
// Student LRN — strip non-digits
// ============================================================================

export function normalizeLrn(raw: string): string | null {
  // Strip everything but digits — handles "117-964-180-001" or "117 964 180 001"
  const digits = raw.replace(/\D/g, '');
  return /^\d{12}$/.test(digits) ? digits : null;
}

// ============================================================================
// School year — accept "2025-2026", "2025 - 2026", "2025/2026", "SY 2025-2026"
// ============================================================================

export function normalizeSchoolYear(raw: string): string | null {
  const match = raw.match(/(\d{4})\s*[-/]\s*(\d{4})/);
  if (!match) return null;
  const start = parseInt(match[1], 10);
  const end = parseInt(match[2], 10);
  if (end !== start + 1) return null;
  return `${start}-${end}`;
}
