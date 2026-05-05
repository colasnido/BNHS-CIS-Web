import { requirePageRole } from "@/services/auth.guards";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { getUser } from "@/services/user.service";

export const metadata = {
  title: {
    default: "Faculty Dashboard",
    template: "%s | Faculty Dashboard",
  },
};

export default async function FacultyDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Gate: faculty only past this point.
  const auth = await requirePageRole(["faculty"]);

  // Pull the Firestore profile to get displayName (auth claim only has uid + role)
  const profile = await getUser(auth.uid);

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardSidebar
        role="faculty"
        displayName={
          profile?.displayName ?? auth.email.split("@")[0] ?? "Faculty"
        }
        email={auth.email}
      />
      <div className="lg:pl-64">{children}</div>
    </div>
  );
}
