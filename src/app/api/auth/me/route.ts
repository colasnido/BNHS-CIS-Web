import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/services/auth.service';

/**
 * GET /api/auth/me
 *
 * Returns the current user's basic info including the mustChangePassword flag.
 * Used by login forms after creating the session cookie to determine where
 * to redirect (dashboard vs /change-password).
 *
 * Returns 401 if no valid session.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  return NextResponse.json({
    uid: user.uid,
    email: user.email,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  });
}
