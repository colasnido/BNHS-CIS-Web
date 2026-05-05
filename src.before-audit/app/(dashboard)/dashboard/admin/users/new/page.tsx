import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { UserForm } from '@/features/users/components/UserForm';
import { listClasses } from '@/services/class.service';

export const metadata = { title: 'New user' };

export default async function NewUserPage() {
  const classes = await listClasses();

  return (
    <>
      <DashboardPageHeader
        title="New user"
        description="Create a Firebase Auth account and assign a role."
      />
      <div className="p-6 sm:p-8">
        <div className="mx-auto max-w-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <UserForm classes={classes} />
        </div>
      </div>
    </>
  );
}
