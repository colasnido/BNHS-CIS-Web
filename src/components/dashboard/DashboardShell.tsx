'use client';

import { useState } from 'react';
import { TopBar } from '@/components/dashboard/TopBar';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { Toaster } from '@/components/ui/Toast';
import type { Role } from '@/services/auth.service';

interface DashboardShellProps {
  role: Role;
  displayName: string;
  email: string;
  children: React.ReactNode;
}

/**
 * Dashboard shell — owns the sidebar mobile-open state, composes TopBar +
 * Sidebar, and renders children inside the offset content area.
 *
 * Why this is a client component: the sidebar drawer state is local UI state
 * that doesn't need to round-trip to the server. The actual auth check
 * happens in each role's layout (server component) before this renders.
 */
export function DashboardShell({
  role,
  displayName,
  email,
  children,
}: DashboardShellProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardSidebar
        role={role}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      <div className="lg:pl-60">
        <TopBar
          role={role}
          displayName={displayName}
          email={email}
          onMenuClick={() => setIsMobileOpen(true)}
        />
        <main>{children}</main>
      </div>

      <Toaster />
    </div>
  );
}
