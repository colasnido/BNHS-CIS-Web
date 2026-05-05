import { requirePageRole } from '@/services/auth.guards';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
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
  // Gate: students only past this point.
  const auth = await requirePageRole(['student']);

  // Pull the Firestore profile to get displayName (auth claim only has uid + role)
  const profile = await getUser(auth.uid);

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardSidebar
        role="student"
        displayName={profile?.displayName ?? auth.email.split('@')[0] ?? 'Student'}
        email={auth.email}
      />
      <div className="lg:pl-64">{children}</div>
    </div>
  );
}
