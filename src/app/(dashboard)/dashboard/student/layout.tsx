import { requirePageRole } from '@/services/auth.guards';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { getUser } from '@/services/user.service';

export const metadata = {
  title: {
    default: 'Student Dashboard',
    template: '%s | Student Dashboard',
  },
};

export default async function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await requirePageRole(['student']);
  const profile = await getUser(auth.uid);

  return (
    <DashboardShell
      role="student"
      displayName={profile?.displayName ?? auth.email.split('@')[0] ?? 'Student'}
      email={auth.email}
    >
      {children}
    </DashboardShell>
  );
}
