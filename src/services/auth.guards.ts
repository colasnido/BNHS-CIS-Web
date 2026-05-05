import 'server-only';

import { redirect } from 'next/navigation';
import { getCurrentUser, type Role, type AuthUser } from '@/services/auth.service';

/**
 * Page-level auth guard. Call at the top of any dashboard page or layout.
 *
 * - Not signed in → redirect to the role's login page (or admin login if unknown)
 * - Signed in but wrong role → redirect to their own dashboard
 * - Authorized → return the AuthUser
 */
export async function requirePageRole(allowed: Role[]): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    // Send unauthenticated visitors to the most likely login page
    const loginPath =
      allowed[0] === 'admin'
        ? '/auth/admin'
        : allowed[0] === 'faculty'
          ? '/auth/faculty'
          : '/auth/student';
    redirect(loginPath);
  }

  if (!user.role || !allowed.includes(user.role)) {
    // Signed in but wrong section — bounce them to their own dashboard
    if (user.role === 'admin') redirect('/dashboard/admin');
    if (user.role === 'faculty') redirect('/dashboard/faculty');
    if (user.role === 'student') redirect('/dashboard/student');
    redirect('/');
  }

  return user;
}
