"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bed,
  Bell,
  Calendar,
  Home,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  Users,
  Utensils,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
};

interface DashboardShellProps {
  title: string;
  description?: string;
  navItems: NavItem[];
  children: ReactNode;
  quickActions?: ReactNode;
  filters?: ReactNode;
  user?: {
    name?: string | null;
    email?: string | null;
  };
}

export function DashboardShell({
  title,
  description,
  navItems,
  children,
  quickActions,
  filters,
  user,
}: DashboardShellProps) {
  const pathname = usePathname();
  const normalizedPath = pathname ?? "";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const updateMatch = () => setIsDesktop(mediaQuery.matches);
    updateMatch();
    mediaQuery.addEventListener("change", updateMatch);
    return () => mediaQuery.removeEventListener("change", updateMatch);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const sidebarWidth = collapsed ? 88 : 280;
  const layoutOffset = isDesktop ? sidebarWidth : 0;

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <div className="min-h-screen bg-neutral text-text">
        <aside
          className="fixed inset-y-0 left-0 z-40 hidden border-r border-border bg-white shadow-soft transition-[width] duration-300 lg:flex"
          style={isDesktop ? { width: sidebarWidth } : undefined}
        >
          <SidebarContent
            navItems={navItems}
            pathname={normalizedPath}
            collapsed={collapsed && isDesktop}
            user={user}
          />
        </aside>

        <SheetContent side="left" className="w-[280px] border-r border-border p-0 lg:hidden">
          <SidebarContent
            navItems={navItems}
            pathname={normalizedPath}
            collapsed={false}
            user={user}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>

        <header
          className="fixed top-0 right-0 z-30 flex h-16 items-center justify-between border-b border-border bg-white/95 px-4 shadow-soft transition-[left] duration-300 backdrop-blur-sm sm:px-6"
          style={{ left: layoutOffset }}
        >
          <div className="flex items-center gap-3">
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="rounded-xl text-text hover:bg-neutral lg:hidden"
                aria-label="Open navigation"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <Button
              variant="ghost"
              size="icon-sm"
              className="hidden rounded-xl text-text-light hover:bg-neutral hover:text-text lg:inline-flex"
              onClick={() => setCollapsed((prev) => !prev)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Menu className="size-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-text">{title}</h1>
              {description ? <p className="text-sm text-text-light">{description}</p> : null}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <SearchField />
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              className="relative rounded-xl text-text-light hover:bg-neutral hover:text-text"
              aria-label="View notifications"
            >
              <Bell className="size-5" />
              <span className="absolute right-2 top-2 inline-flex size-2 rounded-full bg-danger" />
            </Button>
            {quickActions ? <div className="flex items-center gap-2">{quickActions}</div> : null}
          </div>
        </header>

        <main
          className="transition-[margin-left] duration-300"
          style={{ marginLeft: layoutOffset }}
        >
          <div className="px-4 pb-10 pt-20 sm:px-6 lg:px-10">
            {filters ? <div className="mb-6 flex flex-wrap items-center gap-2">{filters}</div> : null}
            <div className="space-y-6">{children}</div>
          </div>
        </main>
      </div>
    </Sheet>
  );
}

const navIconByPath: Record<string, (typeof Home)> = {
  "/": Home,
  "/admin": LayoutDashboard,
  "/admin/bookings": Calendar,
  "/admin/catering": Utensils,
  "/admin/resources": Settings,
  "/staff": Users,
  "/caterer": Utensils,
};

function getIconForItem(href: string, label: string) {
  const normalizedHref = href.replace(/\/$/, "");
  if (navIconByPath[normalizedHref]) {
    return navIconByPath[normalizedHref];
  }

  switch (label.toLowerCase()) {
    case "dashboard":
      return LayoutDashboard;
    case "bookings":
      return Calendar;
    case "catering":
    case "catering jobs":
    case "catering schedule":
      return Utensils;
    case "accommodation":
      return Bed;
    case "settings":
      return Settings;
    case "staff":
      return Users;
    default:
      return Home;
  }
}

function SidebarContent({
  navItems,
  pathname,
  collapsed,
  user,
  onNavigate,
}: {
  navItems: NavItem[];
  pathname: string;
  collapsed: boolean;
  user?: DashboardShellProps["user"];
  onNavigate?: () => void;
}) {
  const initials = useMemo(() => getInitials(user?.name ?? user?.email ?? "Team"), [user?.name, user?.email]);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/" className="flex w-full items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-sm font-semibold uppercase tracking-[0.12em] text-white">
            HCC
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text">Holy Cross Centre</p>
              <p className="text-xs text-text-light">Admin Portal</p>
            </div>
          ) : null}
        </Link>
      </div>
      <ScrollArea className="flex-1 px-4 py-6">
        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = getIconForItem(item.href, item.label);
            return (
              <SheetClose asChild key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 hover:scale-[1.02]",
                    isActive ? "bg-secondary text-primary" : "text-text-light hover:bg-neutral hover:text-text",
                    collapsed && "justify-center px-0"
                  )}
                  onClick={onNavigate}
                >
                  <Icon className="size-5" />
                  {!collapsed ? <span className="truncate">{item.label}</span> : null}
                </Link>
              </SheetClose>
            );
          })}
        </nav>
      </ScrollArea>
      <div className="border-t border-border px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/90 text-sm font-semibold text-white">
            {initials}
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text">{user?.name ?? "Team member"}</p>
              {user?.email ? <p className="truncate text-xs text-text-light">{user.email}</p> : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SearchField() {
  return (
    <div className="relative">
      <Input
        placeholder="Search bookings..."
        className="h-10 w-64 rounded-xl border border-border bg-neutral pl-10 text-sm text-text placeholder:text-text-light focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-light" aria-hidden />
    </div>
  );
}

function getInitials(input: string) {
  const parts = input
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "HCC";
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}
