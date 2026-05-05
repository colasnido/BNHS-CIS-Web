/**
 * Layout for the (dashboard) route group.
 *
 * IMPORTANT: This layout replaces the public site's navbar/footer because
 * dashboard pages need the sidebar shell instead. The route group convention
 * means files at /(dashboard)/dashboard/* render with this layout INSTEAD of
 * the public site's navbar/footer (when the public pages are inside (public)).
 *
 * Auth is enforced inside each role's nested layout — not here — so this
 * file stays minimal.
 */

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
