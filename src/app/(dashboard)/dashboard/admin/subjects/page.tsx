import { listSubjects } from '@/services/subject.service';
import { listClasses } from '@/services/class.service';
import { listUsersByRole } from '@/services/user.service';
import { SubjectsAdminClient } from '@/features/subjects/components/SubjectsAdminClient';

export const metadata = { title: 'Subjects' };
export const dynamic = 'force-dynamic';

export default async function AdminSubjectsPage() {
  const [subjects, classes, faculty] = await Promise.all([
    listSubjects(),
    listClasses(),
    listUsersByRole('faculty'),
  ]);

  return (
    <SubjectsAdminClient
      subjects={subjects}
      classes={classes}
      faculty={faculty}
    />
  );
}
