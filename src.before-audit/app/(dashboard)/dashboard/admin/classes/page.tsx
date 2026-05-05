import { listClasses } from '@/services/class.service';
import { listUsersByRole } from '@/services/user.service';
import { ClassesAdminClient } from '@/features/classes/components/ClassesAdminClient';

export const metadata = { title: 'Classes' };
export const dynamic = 'force-dynamic';

export default async function AdminClassesPage() {
  const [classes, faculty] = await Promise.all([
    listClasses(),
    listUsersByRole('faculty'),
  ]);

  return <ClassesAdminClient classes={classes} faculty={faculty} />;
}
