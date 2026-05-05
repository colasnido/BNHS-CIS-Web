'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ADMIN_NAV, FACULTY_NAV, STUDENT_NAV } from '@/constants/routes';
import type { Role } from '@/services/auth.service';

interface DashboardSidebarProps {
  role: Role;
  displayName: string;
  email: string;
}

const NAV_BY_ROLE = {
  admin: ADMIN_NAV,
  faculty: FACULTY_NAV,
  student: STUDENT_NAV,
} as const;

const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administrator',
  faculty: 'Faculty',
  student: 'Student',
};

export function DashboardSidebar({
  role,
  displayName,
  email,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const items = NAV_BY_ROLE[role];

  const isActive = (href: string) => {
    if (pathname === href) return true;
    // Don't match dashboard root for sub-pages
    if (href.endsWith(`/${role}`)) return pathname === href;
    return pathname.startsWith(href);
  };

  async function handleSignOut() {
    await fetch('/api/auth/session', { method: 'DELETE' });
    window.location.href = '/';
  }

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        aria-label="Toggle navigation"
        aria-expanded={isMobileOpen}
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed left-4 top-4 z-40 inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 lg:hidden"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          {isMobileOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Backdrop on mobile */}
      {isMobileOpen && (
        <div
          aria-hidden="true"
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Dashboard navigation"
      >
        {/* Brand */}
        <div className="border-b border-slate-200 bg-[#0f1f3a] px-6 py-5 text-white">
          <Link href="/" className="block">
            <span className="font-serif text-base font-semibold">BNHS Portal</span>
            <span className="mt-0.5 block text-[11px] uppercase tracking-wider text-slate-300">
              {ROLE_LABEL[role]}
            </span>
          </Link>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {items.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8a85c] ${
                      active
                        ? 'bg-slate-100 text-[#0f1f3a]'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-[#0f1f3a]'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User card */}
        <div className="border-t border-slate-200 px-4 py-4">
          <p className="truncate text-sm font-medium text-slate-900">
            {displayName}
          </p>
          <p className="truncate text-xs text-slate-500">{email}</p>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-3 w-full border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8a85c]"
          >
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
