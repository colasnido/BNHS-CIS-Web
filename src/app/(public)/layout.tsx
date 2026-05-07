import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';

/**
 * Layout for the (public) route group — wraps every public page with the
 * site Navbar + Footer. Dashboard pages live under (dashboard) and use
 * DashboardShell instead, so they don't get this chrome.
 *
 * The flex column with min-h-screen is what makes the footer stick to the
 * bottom of short pages.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
