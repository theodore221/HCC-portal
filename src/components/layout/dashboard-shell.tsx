"use client";

import { type ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
};

interface DashboardShellProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  navItems: NavItem[];
  children: ReactNode;
}

export function DashboardShell({
  title,
  description,
  actions,
  navItems,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="relative flex flex-1 flex-col gap-6 lg:flex-row">
      <MobileNav
        navItems={navItems}
        pathname={pathname}
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-28 max-h-[calc(100vh-7rem)] overflow-hidden rounded-3xl border border-olive-100 bg-white shadow-soft">
          <div className="border-b border-olive-100 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-olive-500">
              Navigation
            </p>
          </div>
          <nav className="flex flex-col gap-1 overflow-y-auto px-2 py-4 text-sm font-medium text-olive-700">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-2xl px-4 py-2 transition-colors",
                    isActive
                      ? "bg-olive-100 text-olive-900 shadow-soft"
                      : "hover:bg-olive-50"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
      <div className="flex flex-1 flex-col gap-6">
        <div className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-olive-100 bg-white shadow-soft">
          <div className="flex flex-col gap-4 border-b border-olive-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-olive-200 text-olive-700 transition-colors hover:bg-olive-50 lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
              >
                <HamburgerIcon />
              </button>
              <div className="space-y-1">
                <h1 className="text-xl font-semibold text-olive-900 sm:text-2xl">
                  {title}
                </h1>
                {description ? (
                  <p className="text-sm text-olive-600">{description}</p>
                ) : null}
              </div>
            </div>
            {actions ? (
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                {actions}
              </div>
            ) : null}
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-6">
            <div className="w-full space-y-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MobileNavProps {
  navItems: NavItem[];
  pathname: string | null;
  open: boolean;
  onClose: () => void;
}

function MobileNav({ navItems, pathname, open, onClose }: MobileNavProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex bg-olive-900/20 backdrop-blur-sm lg:hidden">
      <div className="flex h-full w-72 max-w-full flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-olive-100 px-5 py-4">
          <p className="text-sm font-semibold text-olive-900">Menu</p>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-olive-200 text-olive-700 transition-colors hover:bg-olive-50"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <CloseIcon />
          </button>
        </div>
        <nav className="flex max-h-[calc(100vh-4.5rem)] flex-col gap-1 overflow-y-auto px-3 py-4 text-sm font-medium text-olive-700">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-2xl px-4 py-2",
                  isActive
                    ? "bg-olive-100 text-olive-900 shadow-soft"
                    : "hover:bg-olive-50"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <button
        type="button"
        aria-label="Close navigation"
        className="h-full flex-1"
        onClick={onClose}
      />
    </div>
  );
}

function HamburgerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m6 6 12 12M6 18 18 6" />
    </svg>
  );
}
