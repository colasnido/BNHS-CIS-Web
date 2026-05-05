'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { Role } from '@/services/auth.service';

interface TopBarProps {
  role: Role;
  displayName: string;
  email: string;
  /** Optional callback when sidebar toggle is clicked (mobile) */
  onMenuClick?: () => void;
}

const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin',
  faculty: 'Faculty',
  student: 'Student',
};

/**
 * Build breadcrumb segments from the current pathname.
 *
 * Examples:
 *   /dashboard/admin → ["Admin"]
 *   /dashboard/admin/users → ["Admin", "Users"]
 *   /dashboard/admin/users/new → ["Admin", "Users", "New"]
 *   /dashboard/admin/users/abc123/edit → ["Admin", "Users", "Edit"]
 */
function buildCrumbs(pathname: string): { label: string; href: string }[] {
  const parts = pathname.split('/').filter(Boolean);
  // parts looks like ["dashboard", "admin", "users", "new"]
  // Drop the leading "dashboard"
  if (parts[0] !== 'dashboard') return [];

  const crumbs: { label: string; href: string }[] = [];
  let href = '/dashboard';

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    href += `/${part}`;

    // Hide opaque IDs from the breadcrumb (24-char Firestore-ish IDs)
    if (part.length > 16 && /^[a-zA-Z0-9]+$/.test(part)) continue;

    // Capitalize the part for display
    const label = part.charAt(0).toUpperCase() + part.slice(1);
    crumbs.push({ label, href });
  }

  return crumbs;
}

export function TopBar({ role, displayName, email, onMenuClick }: TopBarProps) {
  const pathname = usePathname();
  const crumbs = buildCrumbs(pathname);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isMenuOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  async function handleSignOut() {
    await fetch('/api/auth/session', { method: 'DELETE' });
    window.location.href = '/';
  }

  // Take initials for avatar fallback
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      {/* Left side: mobile menu + breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Toggle navigation"
          onClick={onMenuClick}
          className="inline-flex h-9 w-9 items-center justify-center text-slate-600 hover:text-slate-900 lg:hidden"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Breadcrumbs (hidden on small screens) */}
        <nav aria-label="Breadcrumb" className="hidden sm:block">
          <ol className="flex items-center gap-1.5 text-sm">
            {crumbs.length === 0 ? (
              <li className="font-medium text-slate-900">{ROLE_LABEL[role]}</li>
            ) : (
              crumbs.map((crumb, i) => (
                <li key={crumb.href} className="flex items-center gap-1.5">
                  {i > 0 && (
                    <svg className="h-3.5 w-3.5 text-slate-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                  {i === crumbs.length - 1 ? (
                    <span className="font-medium text-slate-900">{crumb.label}</span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="text-slate-500 hover:text-slate-900 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </li>
              ))
            )}
          </ol>
        </nav>
      </div>

      {/* Right side: user menu */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 text-sm text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          <span
            aria-hidden="true"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700"
          >
            {initials || '?'}
          </span>
          <span className="hidden font-medium sm:inline">{displayName.split(' ')[0]}</span>
          <svg className="hidden h-3.5 w-3.5 text-slate-400 sm:block" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isMenuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full z-30 mt-2 w-64 border border-slate-200 bg-white py-1 shadow-lg"
          >
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="truncate text-sm font-medium text-slate-900">{displayName}</p>
              <p className="mt-0.5 truncate text-xs text-slate-500">{email}</p>
              <p className="mt-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                {ROLE_LABEL[role]}
              </p>
            </div>
            <Link
              href="/"
              role="menuitem"
              onClick={() => setIsMenuOpen(false)}
              className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              View public site
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              className="block w-full border-t border-slate-100 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
