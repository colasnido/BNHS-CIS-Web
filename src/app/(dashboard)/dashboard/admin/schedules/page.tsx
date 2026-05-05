import { listSchedules } from '@/services/schedule.service';
import { listSubjects } from '@/services/subject.service';
import { listClasses } from '@/services/class.service';
import { listUsersByRole } from '@/services/user.service';
import { SchedulesAdminClient } from '@/features/schedules/components/SchedulesAdminClient';

export const metadata = { title: 'Schedules' };
export const dynamic = 'force-dynamic';

export default async function AdminSchedulesPage() {
  const [schedules, subjects, classes, faculty] = await Promise.all([
    listSchedules(),
    listSubjects(),
    listClasses(),
    listUsersByRole('faculty'),
  ]);

  return (
    <SchedulesAdminClient
      schedules={schedules}
      subjects={subjects}
      classes={classes}
      faculty={faculty}
    />
  );
}
