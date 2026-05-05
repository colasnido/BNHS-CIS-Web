"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { NAV_LINKS, LOGIN_LINKS, ROUTES } from "@/constants/routes";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import logoAsset from "./logo.png";

/**
 * Logo asset for the navbar. Replace ./logo.png to update the brand mark.
 * If the file is missing, the navbar falls back to a styled "B".
 */
const LOGO_SRC = logoAsset;

export function Navbar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const loginRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) =>
    href === ROUTES.HOME ? pathname === href : pathname.startsWith(href);

  // Close login dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (loginRef.current && !loginRef.current.contains(e.target as Node)) {
        setIsLoginOpen(false);
      }
    }
    if (isLoginOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isLoginOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsLoginOpen(false);
        setIsMobileOpen(false);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white">
      {/* Utility bar */}
      <div className="border-b border-slate-200 bg-[#0f1f3a] text-white">
        <Container>
          <div className="flex h-9 items-center justify-between text-xs">
            <span className="hidden sm:inline text-slate-300">
              Department of Education · Region VII · School ID 302812
            </span>

            {/* Login dropdown */}
            <div ref={loginRef} className="relative">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={isLoginOpen}
                onClick={() => setIsLoginOpen(!isLoginOpen)}
                className="flex items-center gap-1 font-medium text-slate-200 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c8a85c]"
              >
                Sign In
                <svg
                  className={`h-3 w-3 transition-transform ${isLoginOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isLoginOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-10 mt-1 w-44 border border-slate-200 bg-white py-1 shadow-lg"
                >
                  {LOGIN_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      role="menuitem"
                      onClick={() => setIsLoginOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#0f1f3a] focus-visible:bg-slate-50 focus-visible:outline-none"
                    >
                      {link.label} Login
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Container>
      </div>

      {/* Main nav */}
      <div className="border-b border-slate-200">
        <Container>
          <nav
            className="flex h-16 items-center justify-between"
            aria-label="Primary"
          >
            {/* Brand: logo image with fallback to letter mark */}
            <Link
              href={ROUTES.HOME}
              className="group flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c8a85c]"
            >
              <Logo src={LOGO_SRC} fallbackText="B" />
              <span className="flex flex-col leading-tight">
                <span className="font-serif text-base font-semibold text-slate-900">
                  Badiang National High School
                </span>
                <span className="hidden text-[11px] uppercase tracking-wider text-slate-500 sm:inline">
                  Est. 1969
                </span>
              </span>
            </Link>

            {/* Desktop links */}
            <ul className="hidden items-center gap-1 md:flex">
              {NAV_LINKS.map((link) => {
                const active = isActive(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={`relative px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8a85c] ${
                        active
                          ? "text-[#0f1f3a]"
                          : "text-slate-600 hover:text-[#0f1f3a]"
                      }`}
                    >
                      {link.label}
                      {active && (
                        <span
                          aria-hidden="true"
                          className="absolute inset-x-3 -bottom-px h-0.5 bg-[#c8a85c]"
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <button
              type="button"
              aria-label={isMobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileOpen}
              aria-controls="mobile-menu"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8a85c] md:hidden"
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
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </nav>

          {isMobileOpen && (
            <div
              id="mobile-menu"
              className="border-t border-slate-200 py-3 md:hidden"
            >
              <ul className="space-y-1">
                {NAV_LINKS.map((link) => {
                  const active = isActive(link.href);
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setIsMobileOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={`block rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                          active
                            ? "bg-slate-100 text-[#0f1f3a]"
                            : "text-slate-700 hover:bg-slate-50 hover:text-[#0f1f3a]"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-3 border-t border-slate-200 pt-3">
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Sign in
                </p>
                <ul className="space-y-1">
                  {LOGIN_LINKS.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setIsMobileOpen(false)}
                        className="block rounded-md px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#0f1f3a]"
                      >
                        {link.label} Login
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </Container>
      </div>
    </header>
  );
}
