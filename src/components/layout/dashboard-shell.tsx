"use client";

import { type ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

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

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <div className="relative flex flex-1 flex-col gap-6 lg:grid lg:grid-cols-[220px_1fr] lg:items-start">
        <MobileNavigation navItems={navItems} pathname={pathname} />
        <aside className="hidden lg:flex lg:w-[220px] lg:flex-col">
          <div className="sticky top-24 flex max-h-[calc(100vh-6rem)] flex-1 flex-col overflow-hidden rounded-3xl border border-olive-100 bg-white shadow-soft">
            <div className="border-b border-olive-100 px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-olive-500">
                Navigation
              </p>
            </div>
            <ScrollArea className="flex-1 px-3 py-4">
              <NavigationMenu className="w-full justify-start">
                <NavigationMenuList className="flex w-full flex-col gap-1">
                  {navItems.map((item) => {
                    const isActive =
                      normalizedPath === item.href || normalizedPath.startsWith(`${item.href}/`);
                    return (
                      <NavigationMenuItem key={item.href}>
                        <NavigationMenuLink asChild>
                          <Link
                            href={item.href}
                            className={cn(
                              "flex w-full items-center rounded-2xl px-4 py-2 text-sm font-medium transition-colors",
                              isActive
                                ? "bg-olive-100 text-olive-900 shadow-soft"
                                : "text-olive-700 hover:bg-olive-50"
                            )}
                          >
                            {item.label}
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
          <header className="rounded-3xl border border-olive-100 bg-olive-50/60 px-4 py-5 shadow-soft sm:px-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="lg:hidden rounded-full border-olive-200 text-olive-700 hover:bg-olive-100"
                    aria-label="Open navigation"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <div className="space-y-1">
                  <h1 className="text-xl font-semibold text-olive-900 sm:text-2xl">{title}</h1>
                  {description ? (
                    <p className="text-sm text-olive-600">{description}</p>
                  ) : null}
                </div>
              </div>
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
          </header>
          <section className="flex-1 rounded-3xl border border-olive-100 bg-white shadow-soft">
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
      className="w-[280px] gap-0 border-r border-olive-100 p-0 lg:hidden"
    >
      <div className="flex items-center justify-between border-b border-olive-100 px-5 py-4">
        <p className="text-sm font-semibold text-olive-900">Menu</p>
        <SheetClose asChild>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full border-olive-200 text-olive-700 hover:bg-olive-100"
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
                          "flex w-full items-center rounded-2xl px-4 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-olive-100 text-olive-900 shadow-soft"
                            : "text-olive-700 hover:bg-olive-50"
                        )}
                      >
                        {item.label}
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
