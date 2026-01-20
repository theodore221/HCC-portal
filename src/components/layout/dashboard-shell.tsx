"use client";

import { type ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bed,
  Bell,
  Calendar,
  Home,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelRightOpen,
  Settings,
  Users,
  Utensils,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/layout/user-menu";

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

  const sidebarWidth = collapsed ? 88 : 250;
  const layoutOffset = isDesktop ? sidebarWidth : 0;

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <div className="min-h-screen bg-neutral text-text">
        <aside
          className="fixed inset-y-0 left-0 z-40 hidden h-[100dvh] border-r border-border bg-white shadow-soft transition-[width] duration-300 lg:flex"
          style={isDesktop ? { width: sidebarWidth } : undefined}
        >
          <SidebarContent
            navItems={navItems}
            pathname={normalizedPath}
            collapsed={collapsed && isDesktop}
            user={user}
            onToggleCollapse={
              isDesktop ? () => setCollapsed((prev) => !prev) : undefined
            }
          />
        </aside>

        <SheetContent
          side="left"
          className="w-[250px] !w-[250px] !max-w-[250px] border-r border-border p-0 lg:hidden"
        >
          <SidebarContent
            navItems={navItems}
            pathname={normalizedPath}
            collapsed={false}
            user={user}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>

        <main
          className="min-h-screen transition-[margin-left] duration-300"
          style={{ marginLeft: layoutOffset }}
        >
          <div className="px-4 pb-10 pt-4 sm:px-6 lg:px-6">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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
                <div>
                  <h1 className="text-xl font-bold text-text">{title}</h1>
                  {description ? (
                    <p className="text-sm text-text-light">{description}</p>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="relative rounded-xl text-text-light hover:bg-neutral hover:text-text"
                  aria-label="View notifications"
                >
                  <Bell className="size-5" />
                  <span className="absolute right-2 top-2 inline-flex size-2 rounded-full bg-danger" />
                </Button>
                {quickActions ? (
                  <div className="flex items-center gap-2">{quickActions}</div>
                ) : null}
              </div>
            </div>

            {filters ? (
              <div className="mb-6 flex flex-wrap items-center gap-2">
                {filters}
              </div>
            ) : null}
            <div className="space-y-6">{children}</div>
          </div>
        </main>
      </div>
    </Sheet>
  );
}

const navIconByPath: Record<string, typeof Home> = {
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
    case "kitchen":
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
  onToggleCollapse,
}: {
  navItems: NavItem[];
  pathname: string;
  collapsed: boolean;
  user?: DashboardShellProps["user"];
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
}) {
  return (
    <div className="flex h-full w-full max-w-full flex-col">
      <div
        className={cn(
          "flex h-16 items-center border-b border-border",
          collapsed ? "px-4" : "px-4"
        )}
      >
        <Link
          href="/"
          className={cn(
            "flex items-center gap-3",
            collapsed ? "gap-0" : "gap-2"
          )}
        >
          <div className="flex size-14 items-center justify-center rounded-xl">
            <img
              src="/logo_notext.svg"
              alt="HCC Logo"
              className="size-full object-contain"
            />
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text">
                Holy Cross Centre
              </p>
              <p className="text-xs text-text-light">Web Portal</p>
            </div>
          ) : null}
        </Link>
        {onToggleCollapse ? (
          <Button
            variant="ghost"
            size="icon-sm"
            className="ml-auto rounded-xl text-text-light hover:bg-neutral hover:text-text"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-pressed={collapsed}
          >
            {collapsed ? (
              <PanelRightOpen className="size-5" />
            ) : (
              <PanelLeftClose className="size-5" />
            )}
          </Button>
        ) : null}
      </div>
      <ScrollArea
        className={cn("flex-1 min-h-0 py-6", collapsed ? "px-3" : "px-4")}
      >
        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (pathname.startsWith(`${item.href}/`) &&
                item.href !== "/admin" &&
                item.href !== "/staff" &&
                item.href !== "/caterer");
            const Icon = getIconForItem(item.href, item.label);
            return (
              <SheetClose asChild key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-secondary text-primary"
                      : "text-text-light hover:bg-neutral hover:text-text",
                    collapsed && "justify-center gap-0 px-0"
                  )}
                  onClick={onNavigate}
                >
                  <Icon className="size-5" />
                  {!collapsed ? (
                    <span className="truncate">{item.label}</span>
                  ) : (
                    <span className="sr-only">{item.label}</span>
                  )}
                </Link>
              </SheetClose>
            );
          })}
        </nav>
      </ScrollArea>
      <div
        className={cn(
          "mt-auto border-t border-border py-5",
          collapsed ? "flex justify-center px-4" : "px-4"
        )}
      >
        {user?.email ? (
          <UserMenu
            email={user.email}
            name={user?.name}
            variant="sidebar"
            collapsed={collapsed}
          />
        ) : (
          <div className="flex size-10 items-center justify-center rounded-full overflow-hidden">
            <img
              src="/logo_notext.svg"
              alt="HCC"
              className="h-full w-full object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
}
