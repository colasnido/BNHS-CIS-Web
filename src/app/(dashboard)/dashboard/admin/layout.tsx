import { requirePageRole } from '@/services/auth.guards';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';

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
  const user = await requirePageRole(['admin']);

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardSidebar
        role="admin"
        displayName={user.email.split('@')[0] || 'Admin'}
        email={user.email}
      />
      <div className="lg:pl-64">{children}</div>
    </div>
  );
}
