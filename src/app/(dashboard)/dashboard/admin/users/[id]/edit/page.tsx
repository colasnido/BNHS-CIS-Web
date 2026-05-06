import { notFound } from 'next/navigation';
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { UserForm } from '@/features/users/components/UserForm';
import { ResetPasswordButton } from '@/features/users/components/ResetPasswordButton';
import { getUser } from '@/services/user.service';
import { listClasses } from '@/services/class.service';
import { requirePageRole } from '@/services/auth.guards';

export const metadata = { title: 'Edit user' };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditUserPage({ params }: PageProps) {
  // Belt and suspenders: dashboard layout already gates this, but the page
  // also calls requirePageRole so a direct URL hit can't slip past if the
  // layout ever changes. Defense in depth costs ~1 line.
  const currentUser = await requirePageRole(['admin']);

  const { id } = await params;
  const [user, classes] = await Promise.all([getUser(id), listClasses()]);
  if (!user) notFound();

  // Don't show "Reset password" for the admin's own row — they should use
  // /change-password to update their own password (proves identity via
  // current password). The API rejects this case too, so the UI guard is
  // mainly to avoid a confusing user experience.
  const showResetButton = user.uid !== currentUser.uid;

  return (
    <>
      <DashboardPageHeader title="Edit user" description={user.displayName} />
      <div className="p-6 sm:p-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Profile editing form */}
          <div className="border border-slate-200 bg-white p-6 sm:p-8">
            <UserForm user={user} classes={classes} />
          </div>

          {/* Account actions — separate card so destructive actions don't
              mingle with the routine "edit" actions in the form above. */}
          {showResetButton && (
            <div className="border border-slate-200 bg-white p-6 sm:p-8">
              <h2 className="font-serif text-base font-semibold text-slate-900">
                Account actions
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Use this if {user.displayName} forgot their password and
                cannot sign in.
              </p>
              <div className="mt-4">
                <ResetPasswordButton
                  userId={user.uid}
                  userDisplayName={user.displayName}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
