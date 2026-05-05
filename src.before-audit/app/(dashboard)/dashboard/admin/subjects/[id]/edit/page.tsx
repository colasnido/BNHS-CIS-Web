import { notFound } from 'next/navigation';
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { SubjectForm } from '@/features/subjects/components/SubjectForm';
import { getSubject } from '@/services/subject.service';
import { listClasses } from '@/services/class.service';
import { listUsersByRole } from '@/services/user.service';

export const metadata = { title: 'Edit subject' };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSubjectPage({ params }: PageProps) {
  const { id } = await params;
  const [subject, classes, faculty] = await Promise.all([
    getSubject(id),
    listClasses(),
    listUsersByRole('faculty'),
  ]);
  if (!subject) notFound();

  return (
    <>
      <DashboardPageHeader title="Edit subject" description={`${subject.code} · ${subject.name}`} />
      <div className="p-6 sm:p-8">
        <div className="mx-auto max-w-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <SubjectForm subject={subject} classes={classes} faculty={faculty} />
        </div>
      </div>
    </>
  );
}
