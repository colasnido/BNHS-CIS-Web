import { requirePageRole } from '@/services/auth.guards';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { getUser } from '@/services/user.service';

export const metadata = {
  title: {
    default: 'Faculty Dashboard',
    template: '%s | Faculty Dashboard',
  },
};

export default async function FacultyDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await requirePageRole(['faculty']);
  const profile = await getUser(auth.uid);

  return (
    <DashboardShell
      role="faculty"
      displayName={profile?.displayName ?? auth.email.split('@')[0] ?? 'Faculty'}
      email={auth.email}
    >
      {children}
    </DashboardShell>
  );
}
