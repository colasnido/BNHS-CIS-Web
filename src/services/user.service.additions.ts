/**
 * ============================================================================
 * Password reset by admin (Pattern A: admin-mediated reset)
 * ============================================================================
 *
 * Use case: a student or faculty member forgot their password. Admin opens
 * the user edit page, clicks "Reset password," and gets back a freshly-
 * generated temporary password to give to the user (verbally or written).
 *
 * The user logs in with the temp password and is forced to set a new one
 * via the existing /change-password flow (mustChangePassword=true).
 *
 * Security properties:
 *   - The new password is generated SERVER-SIDE with crypto.randomBytes,
 *     not client-supplied. This prevents the admin (or a compromised admin
 *     account) from setting a password they then know AND keep in their
 *     control after the user changes it (because the user MUST change it
 *     before the account is usable for anything else).
 *   - All existing sessions for the target user are revoked. If the user
 *     was logged in elsewhere (or someone else was), they're kicked out.
 *   - The temp password is returned to the caller exactly ONCE and never
 *     stored. Anyone who didn't see the API response (e.g., a future
 *     admin) cannot recover it.
 *
 * Add this to the bottom of src/services/user.service.ts. The imports
 * needed are 'crypto' (Node built-in) and the existing imports
 * (adminAuth, collections, Timestamp) which are already present in the
 * file.
 */

// ---------- ADD TO TOP OF user.service.ts (with other imports) ----------
import { randomBytes } from 'node:crypto';

// ---------- ADD TO BOTTOM OF user.service.ts ----------

/**
 * Generate a temporary password for password resets.
 *
 * Format: a 10-character mix of letters and digits, no ambiguous characters
 * (no 0/O, 1/l/I). Easy to read aloud, hard to guess.
 *
 * Why not "Welcome2026" style? A guessable default for ALL reset users
 * means an attacker who knows ANY recently-reset student's account can
 * try the same default on others. Random per-reset is the safer pattern.
 */
function generateTempPassword(): string {
  // Excluded for ambiguity: 0 O o, 1 l I, and similar look-alikes
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = randomBytes(10);
  let out = '';
  for (let i = 0; i < 10; i++) {
    // bytes[i] modulo alphabet length — slight bias acceptable for this purpose
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

/**
 * Reset a user's password to a new randomly-generated temporary value.
 *
 * Returns the temp password as a string — caller is responsible for
 * delivering it to the user. This function does NOT store, log, or display
 * the temp password anywhere else; the returned value is the only copy
 * outside the user's hashed credential in Firebase Auth.
 *
 * Flow after a reset:
 *   1. User logs in with the temp password
 *   2. mustChangePassword=true forces redirect to /change-password
 *   3. User picks a new password they actually know
 *   4. Their account is back to normal usage
 *
 * @param uid Firebase Auth UID of the user to reset
 * @returns The new temporary password (cleartext, ONCE — caller must
 *   deliver it to the user; we do not retain it)
 */
export async function resetUserPassword(uid: string): Promise<string> {
  const tempPassword = generateTempPassword();

  // 1. Update password in Firebase Auth (the password is hashed; cleartext
  //    is sent over HTTPS to Firebase and never persisted by us).
  await adminAuth.updateUser(uid, { password: tempPassword });

  // 2. Revoke all existing sessions/refresh tokens for this user. If the
  //    user (or an attacker who hijacked their session) was logged in
  //    anywhere, they're kicked out and forced to re-authenticate. This
  //    matters because the password reset workflow assumes the original
  //    owner has lost access — we shouldn't leave any session valid.
  await adminAuth.revokeRefreshTokens(uid);

  // 3. Force-change on next login. The /change-password flow will pick
  //    this up via the existing requirePageRole guard and redirect.
  await collections.users().doc(uid).update({
    mustChangePassword: true,
    updatedAt: Timestamp.now(),
  });

  return tempPassword;
}
