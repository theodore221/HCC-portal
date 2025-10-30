import type { Metadata } from "next";
import Link from "next/link";
import { LifeBuoy, Menu, X } from "lucide-react";

import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { getNavigationForRole } from "@/lib/auth/paths";
import { getCurrentProfile } from "@/lib/auth/server";
import type { ProfileRecord } from "@/lib/database.types";

import "./globals.css";

const shellWidthClass = "mx-auto w-full max-w-[min(100vw-2rem,96rem)] px-4 sm:px-6 lg:px-8";

type NavItem = { href: string; label: string };

export const metadata: Metadata = {
  title: "HCC Portal",
  description: "Holy Cross Centre booking and operations portal",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, profile } = await getCurrentProfile();
  const navItems = getNavigationForRole(profile?.role ?? null, profile?.booking_reference ?? null);

  return (
    <html lang="en">
      <body className="min-h-screen bg-olive-50/70 text-olive-900">
        <div className="flex min-h-screen flex-col">
          <AppHeader
            navItems={navItems}
            profile={profile}
            sessionEmail={session?.user.email ?? null}
          />
          <main className="flex-1">
            <div className={`${shellWidthClass} flex flex-1 pb-12 pt-8`}>
              <div className="flex w-full flex-col rounded-[2.5rem] border border-olive-100/80 bg-white/70 p-4 shadow-soft sm:p-6 lg:p-8">
                {children}
              </div>
            </div>
          </main>
          <SupportFooter />
        </div>
      </body>
    </html>
  );
}

interface AppHeaderProps {
  navItems: NavItem[];
  profile: ProfileRecord | null;
  sessionEmail: string | null;
}

function AppHeader({ navItems, profile, sessionEmail }: AppHeaderProps) {
  const email = sessionEmail ?? profile?.email ?? undefined;
  const isAuthenticated = Boolean(email);

  return (
    <header className="sticky top-0 z-50 border-b border-olive-100 bg-white/85 backdrop-blur">
      <div className={`${shellWidthClass} flex items-center gap-4 py-4`}>
        <div className="flex flex-1 items-center gap-3">
          <MobileNavigation navItems={navItems} />
          <BrandMark />
        </div>
        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList className="flex items-center gap-1">
            {navItems.map((item) => (
              <NavigationMenuItem key={item.href}>
                <NavigationMenuLink asChild>
                  <Link
                    href={item.href}
                    className="rounded-full px-4 py-2 text-sm font-medium text-olive-700 transition-colors hover:bg-olive-50 hover:text-olive-900"
                  >
                    {item.label}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="hidden rounded-full border-olive-200 text-olive-700 hover:bg-olive-100 md:inline-flex"
          >
            <Link href="/support">
              <LifeBuoy className="h-4 w-4" />
              <span className="font-semibold">Support</span>
            </Link>
          </Button>
          {isAuthenticated && email ? (
            <UserMenu email={email} name={profile?.full_name} />
          ) : (
            <Button asChild size="sm" className="rounded-full bg-olive-600 text-white hover:bg-olive-700">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

function BrandMark({ showTagline = true }: { showTagline?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-olive-600 text-sm font-semibold uppercase tracking-[0.12em] text-white shadow-soft">
        HCC
      </div>
      <div className="min-w-0">
        <span className="block text-sm font-semibold text-olive-900">Holy Cross Centre</span>
        {showTagline ? (
          <span className="hidden text-xs text-olive-600 sm:inline">Booking · Catering · Accommodation</span>
        ) : null}
      </div>
    </Link>
  );
}

function MobileNavigation({ navItems }: { navItems: NavItem[] }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full border-olive-200 text-olive-700 hover:bg-olive-100 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] gap-0 border-r border-olive-100 p-0">
        <div className="flex items-center justify-between border-b border-olive-100 px-5 py-4">
          <BrandMark showTagline={false} />
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
        <ScrollArea className="h-[calc(100vh-10rem)] px-4 py-4">
          <NavigationMenu className="w-full justify-start">
            <NavigationMenuList className="flex w-full flex-col gap-1">
              {navItems.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <SheetClose asChild>
                    <NavigationMenuLink asChild>
                      <Link
                        href={item.href}
                        className="flex w-full items-center rounded-2xl px-4 py-2 text-sm font-medium text-olive-700 transition-colors hover:bg-olive-50 hover:text-olive-900"
                      >
                        {item.label}
                      </Link>
                    </NavigationMenuLink>
                  </SheetClose>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </ScrollArea>
        <div className="border-t border-olive-100 px-5 py-4">
          <Button
            asChild
            variant="outline"
            className="w-full justify-center rounded-full border-olive-200 text-olive-700 hover:bg-olive-100"
          >
            <Link href="/support">
              <LifeBuoy className="h-4 w-4" />
              <span className="font-semibold">Need assistance?</span>
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SupportFooter() {
  return (
    <footer className="border-t border-olive-100 bg-white/80 backdrop-blur">
      <div
        className={`${shellWidthClass} flex flex-col gap-3 py-4 text-xs text-olive-600 sm:flex-row sm:items-center sm:justify-between sm:text-sm`}
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-olive-100 px-3 py-1 text-xs font-medium text-olive-700 shadow-soft">
            <span className="h-2 w-2 rounded-full bg-olive-500" aria-hidden />
            Systems operational
          </span>
          <span className="hidden text-olive-500 sm:inline">
            Updated {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <div className="flex flex-col gap-1 text-olive-600 sm:flex-row sm:items-center sm:gap-4">
          <span>© {new Date().getFullYear()} Holy Cross Centre</span>
          <span className="hidden sm:inline">v1.0 · Internal preview</span>
          <Link href="/support" className="font-medium text-olive-700 hover:text-olive-900">
            Contact support
          </Link>
        </div>
      </div>
    </footer>
  );
}
