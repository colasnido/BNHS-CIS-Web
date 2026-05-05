import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { ClassForm } from '@/features/classes/components/ClassForm';
import { listUsersByRole } from '@/services/user.service';

export const metadata = { title: 'New class' };

export default async function NewClassPage() {
  const faculty = await listUsersByRole('faculty');

  return (
    <>
      <DashboardPageHeader title="New class" description="Add a new homeroom section." />
      <div className="p-6 sm:p-8">
        <div className="mx-auto max-w-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <ClassForm faculty={faculty} />
        </div>
      </div>
    </>
  );
}
