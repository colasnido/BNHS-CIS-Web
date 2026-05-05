import { requirePageRole } from '@/services/auth.guards';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { getUser } from '@/services/user.service';

export const metadata = {
  title: {
    default: 'Admin Dashboard',
    template: '%s | Admin Dashboard',
  },
};

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Gate: only admins past this point.
  const auth = await requirePageRole(['admin']);
  const profile = await getUser(auth.uid);

  return (
    <DashboardShell
      role="admin"
      displayName={profile?.displayName ?? auth.email.split('@')[0] ?? 'Admin'}
      email={auth.email}
    >
      {children}
    </DashboardShell>
  );
}
