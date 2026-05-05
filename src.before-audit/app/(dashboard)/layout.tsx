/**
 * Layout for the (dashboard) route group.
 *
 * Each role's nested layout (admin/, faculty/, student/) handles auth and
 * renders the DashboardShell. This layout stays minimal — it exists mainly
 * so the route group is well-formed.
 */

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
