"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LifeBuoy, Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { UserMenu } from "@/components/layout/user-menu";
import type { ProfileRecord } from "@/lib/database.types";

export type NavItem = { href: string; label: string };

interface AppHeaderProps {
  navItems: NavItem[];
  profile: ProfileRecord | null;
  sessionEmail: string | null;
  shellWidthClass: string;
}

export function AppHeader({ navItems, profile, sessionEmail, shellWidthClass }: AppHeaderProps) {
  const email = sessionEmail ?? profile?.email ?? undefined;
  const isAuthenticated = Boolean(email);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 4);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 border-b border-border/70 bg-white/95 backdrop-blur-sm transition-shadow ${
        isScrolled ? "shadow-sm" : "shadow-none"
      }`}
    >
      <div className={`${shellWidthClass} flex h-16 items-center gap-4`}>
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
                    className="rounded-lg px-4 py-2 text-sm font-medium text-text-light transition-colors duration-200 hover:bg-gray-100 hover:text-text"
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
            className="hidden rounded-xl border-border text-text-light hover:bg-neutral lg:inline-flex"
          >
            <Link href="/support">
              <LifeBuoy className="h-4 w-4" />
              <span className="font-semibold">Support</span>
            </Link>
          </Button>
          {isAuthenticated && email ? (
            <UserMenu email={email} name={profile?.full_name} />
          ) : (
            <Button asChild size="sm" className="rounded-xl bg-primary text-white hover:bg-primary/90">
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
    <Link href="/" className="flex items-center gap-2">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl transition-transform duration-200 hover:scale-[1.02]">
        <img
          src="/logo_notext.svg"
          alt="HCC Logo"
          className="h-full w-full object-contain"
        />
      </div>
      <div className="min-w-0">
        <span className="block text-sm font-semibold text-text">Holy Cross Centre</span>
        {showTagline ? (
          <span className="hidden text-xs text-text-light sm:inline">
            Booking · Catering · Accommodation
          </span>
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
          className="rounded-xl border-border text-text-light transition-colors duration-200 hover:bg-neutral lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] gap-0 border-r border-border p-0">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <BrandMark showTagline={false} />
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
        <ScrollArea className="h-[calc(100vh-10rem)] px-4 py-4">
          <NavigationMenu className="w-full justify-start">
            <NavigationMenuList className="flex w-full flex-col gap-1">
              {navItems.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <SheetClose asChild>
                    <NavigationMenuLink asChild>
                      <Link
                        href={item.href}
                        className="flex w-full items-center rounded-xl px-4 py-2 text-sm font-medium text-text-light transition-colors duration-200 hover:bg-gray-100 hover:text-text"
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
        <div className="border-t border-border px-5 py-4">
          <Button
            asChild
            variant="outline"
            className="w-full justify-center rounded-xl border-border text-text-light transition-colors duration-200 hover:bg-neutral"
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

