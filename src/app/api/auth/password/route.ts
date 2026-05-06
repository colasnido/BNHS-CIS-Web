import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/services/auth.service';
import { changeUserPassword } from '@/services/user.service';
import { PasswordSchema } from '@/features/users/schema';

/**
 * POST /api/auth/password
 *
 * Body: { newPassword: string }
 *
 * Updates the current user's password and clears their mustChangePassword
 * flag. The caller (ChangePasswordForm) is responsible for re-authenticating
 * the user CLIENT-SIDE before calling this — the server has no way to verify
 * the current password directly (Firebase Admin SDK doesn't support it).
 *
 * The session cookie is the proof that this request is from a logged-in
 * user. The client-side re-auth is the proof that the actual person knows
 * their current password (defends against stolen sessions or shared
 * computers).
 *
 * After the password change, the server REVOKES all existing refresh tokens
 * for this user. Their current session cookie is then invalidated by
 * Firebase on next verification — they'll need to sign in fresh with the
 * new password. This is the safe behavior; the form handles signing the
 * user out and redirecting to login.
 */

const BodySchema = z.object({
  newPassword: PasswordSchema,
});

export async function POST(request: Request) {
  // 1. Must be signed in
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  // 2. Validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid password' },
      { status: 400 }
    );
  }

  // 3. Update password + clear flag + revoke sessions
  try {
    await changeUserPassword(user.uid, parsed.data.newPassword);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[POST /api/auth/password]', error);
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}
