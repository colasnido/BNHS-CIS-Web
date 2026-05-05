import { notFound } from 'next/navigation';
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { ClassForm } from '@/features/classes/components/ClassForm';
import { getClass } from '@/services/class.service';
import { listUsersByRole } from '@/services/user.service';

export const metadata = { title: 'Edit class' };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditClassPage({ params }: PageProps) {
  const { id } = await params;
  const [classRecord, faculty] = await Promise.all([
    getClass(id),
    listUsersByRole('faculty'),
  ]);
  if (!classRecord) notFound();

  return (
    <>
      <DashboardPageHeader
        title="Edit class"
        description={`Grade ${classRecord.gradeLevel} - ${classRecord.name}`}
      />
      <div className="p-6 sm:p-8">
        <div className="mx-auto max-w-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <ClassForm classRecord={classRecord} faculty={faculty} />
        </div>
      </div>
    </>
  );
}
