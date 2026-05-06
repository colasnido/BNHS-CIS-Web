import 'server-only';

import { redirect } from 'next/navigation';
import {
  getCurrentUser,
  type Role,
  type AuthUser,
} from '@/services/auth.service';

/**
 * Page-level auth guard. Call at the top of any dashboard page or layout.
 *
 * Order of checks:
 *   1. Not signed in → redirect to the role's login page
 *   2. Signed in but `mustChangePassword=true` → force redirect to
 *      /change-password regardless of which page they were trying to reach.
 *      The /change-password page itself uses requireSignedIn() instead so
 *      it doesn't redirect-loop.
 *   3. Signed in but wrong role → redirect to their own dashboard
 *   4. Authorized → return the AuthUser
 */
export async function requirePageRole(
  allowed: Role[]
): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    const loginPath =
      allowed[0] === 'admin'
        ? '/auth/admin'
        : allowed[0] === 'faculty'
          ? '/auth/faculty'
          : '/auth/student';
    redirect(loginPath);
  }

  if (user.mustChangePassword) {
    // Critical: force the password change BEFORE any role check, otherwise
    // a logged-in student could navigate around the dashboard with their
    // admin-assigned default password.
    redirect('/change-password');
  }

  if (!user.role || !allowed.includes(user.role)) {
    if (user.role === 'admin') redirect('/dashboard/admin');
    if (user.role === 'faculty') redirect('/dashboard/faculty');
    if (user.role === 'student') redirect('/dashboard/student');
    redirect('/');
  }

  return user;
}

/**
 * Lighter guard — used by the /change-password page itself. Just requires a
 * valid session, no role or mustChangePassword check (since that's the
 * page they're meant to reach when the flag is set).
 */
export async function requireSignedIn(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/');
  return user;
}
