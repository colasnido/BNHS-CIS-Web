import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "BNHS CIS",
    template: "%s | Badiang National High School",
  },
  description: "Official website of Badiang National High School.",
};

/**
 * Root layout — html/body shell only. Navbar + Footer live in the (public)
 * route group's layout so they never render on dashboard pages, which have
 * their own DashboardShell.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-white font-sans text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
