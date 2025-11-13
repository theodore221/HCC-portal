"use client";

import { type ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  LayoutDashboard,
  Menu,
  Users,
  UtensilsCrossed,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
};

const navIconByPath: Record<string, (typeof Home)> = {
  "/": Home,
  "/admin": LayoutDashboard,
  "/staff": Users,
  "/caterer": UtensilsCrossed,
};

function getIconForItem(href: string, label: string) {
  const normalizedHref = href.replace(/\/$/, "");
  if (navIconByPath[normalizedHref]) {
    return navIconByPath[normalizedHref];
  }

  switch (label.toLowerCase()) {
    case "admin":
      return LayoutDashboard;
    case "staff":
      return Users;
    case "caterer":
      return UtensilsCrossed;
    default:
      return Home;
  }
}

interface DashboardShellProps {
  title: string;
  description?: string;
  navItems: NavItem[];
  children: ReactNode;
  quickActions?: ReactNode;
  filters?: ReactNode;
}

export function DashboardShell({
  title,
  description,
  navItems,
  children,
  quickActions,
  filters,
}: DashboardShellProps) {
  const pathname = usePathname();
  const normalizedPath = pathname ?? "";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <div className="relative flex flex-1 flex-col gap-6 lg:grid lg:grid-cols-[auto_1fr] lg:items-start">
        <MobileNavigation navItems={navItems} pathname={pathname} />
        <aside
          className={cn(
            "hidden lg:flex lg:flex-col lg:transition-[width] lg:duration-300",
            collapsed ? "lg:w-20" : "lg:w-72"
          )}
        >
          <div className="sticky top-24 flex max-h-[calc(100vh-6rem)] flex-1 flex-col overflow-hidden rounded-3xl border border-border/70 bg-white shadow-soft">
            <div className="flex items-center justify-between border-b border-border/70 px-5 py-5">
              <p
                className={cn(
                  "text-xs font-semibold uppercase tracking-[0.2em] text-text-light transition-opacity duration-200",
                  collapsed && "opacity-0"
                )}
              >
                Navigation
              </p>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-text-light transition-transform duration-200 hover:scale-[1.05]"
                onClick={() => setCollapsed((prev) => !prev)}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
              </Button>
            </div>
            <ScrollArea className="flex-1 px-3 py-4">
              <NavigationMenu className="w-full justify-start">
                <NavigationMenuList className="flex w-full flex-col gap-1">
                  {navItems.map((item) => {
                    const isActive =
                      normalizedPath === item.href || normalizedPath.startsWith(`${item.href}/`);
                    const Icon = getIconForItem(item.href, item.label);
                    return (
                      <NavigationMenuItem key={item.href}>
                        <NavigationMenuLink asChild>
                          <Link
                            href={item.href}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-2xl px-4 py-2 text-sm font-medium transition-all duration-200",
                              isActive
                                ? "bg-secondary text-primary shadow-soft"
                                : "text-text-light hover:bg-gray-50 hover:text-text",
                              collapsed && "justify-center px-3"
                            )}
                          >
                            <Icon className="size-4" aria-hidden />
                            <span className={cn("whitespace-nowrap", collapsed && "hidden")}>{item.label}</span>
                          </Link>
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                    );
                  })}
                </NavigationMenuList>
              </NavigationMenu>
            </ScrollArea>
          </div>
        </aside>
        <main className="flex flex-1 flex-col gap-6">
          <header className="rounded-3xl border border-border/70 bg-secondary/60 px-4 py-5 shadow-soft backdrop-blur-sm sm:px-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-xl border-border text-text-light transition-colors duration-200 hover:bg-neutral lg:hidden"
                    aria-label="Open navigation"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <div className="space-y-1">
                  <h1 className="text-xl font-semibold text-text sm:text-2xl">{title}</h1>
                  {description ? (
                    <p className="text-sm text-text-light">{description}</p>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-1 items-center justify-between gap-3 lg:flex-none">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="hidden rounded-xl border border-transparent bg-white text-text-light shadow-soft transition-transform duration-200 hover:scale-[1.05] hover:text-text lg:inline-flex"
                  onClick={() => setCollapsed((prev) => !prev)}
                  aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
                </Button>
                <div className="flex w-full flex-col gap-3 lg:w-auto">
                  {filters ? (
                    <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
                      {filters}
                    </div>
                  ) : null}
                  {quickActions ? (
                    <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
                      {quickActions}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </header>
          <section className="flex-1 rounded-3xl border border-border/70 bg-white shadow-soft transition-all duration-200">
            <div className="px-4 py-6 sm:px-6">
              <div className="space-y-6">{children}</div>
            </div>
          </section>
        </main>
      </div>
    </Sheet>
  );
}

interface MobileNavigationProps {
  navItems: NavItem[];
  pathname: string | null;
}

function MobileNavigation({ navItems, pathname }: MobileNavigationProps) {
  return (
    <SheetContent
      side="left"
      className="w-[280px] gap-0 border-r border-border p-0 lg:hidden"
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <p className="text-sm font-semibold text-text">Menu</p>
        <SheetClose asChild>
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl border-border text-text-light transition-colors duration-200 hover:bg-neutral"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </Button>
        </SheetClose>
      </div>
      <ScrollArea className="h-[calc(100vh-4.5rem)] px-3 py-4">
        <NavigationMenu className="w-full justify-start">
          <NavigationMenuList className="flex w-full flex-col gap-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <NavigationMenuItem key={item.href}>
                  <SheetClose asChild>
                    <NavigationMenuLink asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-2xl px-4 py-2 text-sm font-medium transition-colors duration-200",
                          isActive
                            ? "bg-secondary text-primary shadow-soft"
                            : "text-text-light hover:bg-gray-50 hover:text-text"
                        )}
                      >
                        <span>{item.label}</span>
                      </Link>
                    </NavigationMenuLink>
                  </SheetClose>
                </NavigationMenuItem>
              );
            })}
          </NavigationMenuList>
        </NavigationMenu>
      </ScrollArea>
    </SheetContent>
  );
}
