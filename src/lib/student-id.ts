/**
 * Student ID ↔ synthetic email mapping.
 *
 * Firebase Auth requires every account to have an email address. For students,
 * we don't actually have one — they identify by their LRN (Learner Reference
 * Number). The workaround is a "synthetic" email derived deterministically
 * from the LRN, used internally for Firebase Auth only.
 *
 * The student NEVER sees this email. They type their LRN, and the form
 * silently appends @students.bnhs.edu.ph before talking to Firebase.
 *
 * This file is the SINGLE source of truth for the synthetic email format.
 * Login form, admin-create, password change — everywhere derives identically.
 */

/**
 * Synthetic email domain for students. Pick a domain you control or are
 * sure isn't used for real email — otherwise a typo'd LRN could collide
 * with a real address.
 *
 * Using the school's actual domain is fine here because we control DNS for
 * it and don't run mail for the @students subdomain.
 */
export const STUDENT_EMAIL_DOMAIN = 'students.bnhs.edu.ph';

/**
 * Convert a Learner Reference Number to its synthetic email address.
 *
 * @example
 *   studentIdToEmail('117964180001') === '117964180001@students.bnhs.edu.ph'
 */
export function studentIdToEmail(lrn: string): string {
  // Trim only — the LRN itself shouldn't have whitespace, and we want the
  // mapping to be reversible. Validation happens via Zod elsewhere.
  return `${lrn.trim()}@${STUDENT_EMAIL_DOMAIN}`;
}

/**
 * Recover the LRN from a synthetic email, if it is one.
 * Returns null if the email is not in the synthetic format.
 *
 * Used for display purposes (e.g., the admin user table shows LRN, not the
 * weird-looking synthetic email).
 */
export function emailToStudentId(email: string): string | null {
  const suffix = `@${STUDENT_EMAIL_DOMAIN}`;
  if (!email.toLowerCase().endsWith(suffix)) return null;
  const lrn = email.slice(0, -suffix.length);
  // Only return if the prefix looks like a real LRN (12 digits)
  return /^\d{12}$/.test(lrn) ? lrn : null;
}

/**
 * Quick check — is this a synthetic student email?
 */
export function isStudentEmail(email: string): boolean {
  return emailToStudentId(email) !== null;
}
