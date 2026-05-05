import { listUsers } from '@/services/user.service';
import { listClasses } from '@/services/class.service';
import { UsersAdminClient } from '@/features/users/components/UsersAdminClient';

export const metadata = { title: 'Users' };
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ action?: string }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [users, classes] = await Promise.all([listUsers(), listClasses()]);

  return (
    <UsersAdminClient
      users={users}
      classes={classes}
      autoOpenImport={params.action === 'import'}
    />
  );
}
