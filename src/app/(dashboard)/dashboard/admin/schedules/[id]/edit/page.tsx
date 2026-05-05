import { notFound } from 'next/navigation';
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { ScheduleForm } from '@/features/schedules/components/ScheduleForm';
import { getSchedule } from '@/services/schedule.service';
import { listSubjects } from '@/services/subject.service';
import { listClasses } from '@/services/class.service';
import { listUsersByRole } from '@/services/user.service';

export const metadata = { title: 'Edit schedule' };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSchedulePage({ params }: PageProps) {
  const { id } = await params;
  const [schedule, subjects, classes, faculty] = await Promise.all([
    getSchedule(id),
    listSubjects(),
    listClasses(),
    listUsersByRole('faculty'),
  ]);
  if (!schedule) notFound();

  return (
    <>
      <DashboardPageHeader
        title="Edit schedule"
        description={`${schedule.dayOfWeek.toUpperCase()} ${schedule.startTime}–${schedule.endTime}`}
      />
      <div className="p-6 sm:p-8">
        <div className="mx-auto max-w-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <ScheduleForm
            schedule={schedule}
            subjects={subjects}
            classes={classes}
            faculty={faculty}
          />
        </div>
      </div>
    </>
  );
}
