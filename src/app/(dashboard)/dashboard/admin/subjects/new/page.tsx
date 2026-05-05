import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { SubjectForm } from '@/features/subjects/components/SubjectForm';
import { listClasses } from '@/services/class.service';
import { listUsersByRole } from '@/services/user.service';

export const metadata = { title: 'New subject' };

export default async function NewSubjectPage() {
  const [classes, faculty] = await Promise.all([
    listClasses(),
    listUsersByRole('faculty'),
  ]);

  return (
    <>
      <DashboardPageHeader
        title="New subject"
        description="Assign a subject to a class and a teacher."
      />
      <div className="p-6 sm:p-8">
        <div className="mx-auto max-w-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <SubjectForm classes={classes} faculty={faculty} />
        </div>
      </div>
    </>
  );
}
