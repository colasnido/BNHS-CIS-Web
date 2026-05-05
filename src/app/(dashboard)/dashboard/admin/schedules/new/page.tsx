import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { ScheduleForm } from '@/features/schedules/components/ScheduleForm';
import { listSubjects } from '@/services/subject.service';
import { listClasses } from '@/services/class.service';
import { listUsersByRole } from '@/services/user.service';

export const metadata = { title: 'New schedule' };

export default async function NewSchedulePage() {
  const [subjects, classes, faculty] = await Promise.all([
    listSubjects(),
    listClasses(),
    listUsersByRole('faculty'),
  ]);

  return (
    <>
      <DashboardPageHeader
        title="New schedule"
        description="Add a weekly meeting time for a subject."
      />
      <div className="p-6 sm:p-8">
        <div className="mx-auto max-w-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <ScheduleForm subjects={subjects} classes={classes} faculty={faculty} />
        </div>
      </div>
    </>
  );
}
