import { requireSignedIn } from '@/services/auth.guards';
import { ChangePasswordForm } from '@/features/auth/components/ChangePasswordForm';

export const metadata = {
  title: 'Change Password',
};

/**
 * /change-password
 *
 * Reachable in two situations:
 *   1. User just logged in with an admin-assigned password (mustChangePassword=true)
 *      — they were redirected here automatically by the login form
 *   2. User chose to change their password voluntarily (link in dashboard)
 *
 * Either way, the page renders the same form. The form's onSubmit handler
 * uses /api/auth/password.
 *
 * Uses requireSignedIn() (not requirePageRole) so it doesn't redirect-loop
 * for users with the mustChangePassword flag set.
 */
export default async function ChangePasswordPage() {
  const user = await requireSignedIn();

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center bg-slate-50 px-4 py-16">
      <ChangePasswordForm
        userEmail={user.email}
        wasForcedHere={user.mustChangePassword}
      />
    </div>
  );
}
