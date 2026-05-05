import { notFound } from 'next/navigation';
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { UserForm } from '@/features/users/components/UserForm';
import { getUser } from '@/services/user.service';
import { listClasses } from '@/services/class.service';

export const metadata = { title: 'Edit user' };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditUserPage({ params }: PageProps) {
  const { id } = await params;
  const [user, classes] = await Promise.all([getUser(id), listClasses()]);
  if (!user) notFound();

  return (
    <>
      <DashboardPageHeader title="Edit user" description={user.displayName} />
      <div className="p-6 sm:p-8">
        <div className="mx-auto max-w-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <UserForm user={user} classes={classes} />
        </div>
      </div>
    </>
  );
}
