"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, Loader2, UserCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, getInitials } from "@/lib/utils";
import { sbBrowser } from "@/lib/supabase-browser";

interface UserMenuProps {
  email: string;
  name?: string | null;
  variant?: "icon" | "sidebar";
  collapsed?: boolean;
}

export function UserMenu({
  email,
  name,
  variant = "icon",
  collapsed = false,
}: UserMenuProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const supabase = sbBrowser();

  const displayName = name ?? email;
  const initials = getInitials(displayName);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  };

  const triggerAriaLabel = collapsed
    ? "Open user menu"
    : `Open user menu for ${displayName}`;

  const trigger =
    variant === "icon" ? (
      <Button
        variant="outline"
        size="icon"
        className="rounded-xl border-border text-text-light transition-transform transition-colors duration-200 hover:scale-[1.02] hover:bg-neutral"
        aria-label="Open user menu"
        disabled={signingOut}
      >
        {signingOut ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <UserCircle className="h-5 w-5" />
        )}
      </Button>
    ) : (
      <Button
        variant="ghost"
        className={cn(
          "h-auto w-full items-center justify-between gap-3 rounded-xl border border-border bg-neutral px-3 py-3 text-left text-text hover:bg-white",
          collapsed &&
            "w-full justify-center border-none bg-transparent px-0 py-0 text-text-light hover:bg-neutral"
        )}
        aria-label={triggerAriaLabel}
        disabled={signingOut}
      >
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/90 text-sm font-semibold text-white">
          {signingOut ? <Loader2 className="size-5 animate-spin" /> : initials}
        </div>
        {!collapsed ? (
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-semibold text-text">
              {displayName}
            </p>
            <p className="truncate text-xs text-text-light">{email}</p>
          </div>
        ) : (
          <span className="sr-only">{displayName}</span>
        )}
        {!collapsed ? (
          <ChevronsUpDown className="size-4 text-text-light" aria-hidden />
        ) : null}
      </Button>
    );

  const contentProps =
    variant === "sidebar"
      ? {
          align: (collapsed ? "center" : "start") as "center" | "start",
          side: (collapsed ? "right" : "top") as "right" | "top",
          sideOffset: collapsed ? 8 : 12,
        }
      : {
          align: "end" as const,
          sideOffset: 8,
        };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent {...contentProps} className="min-w-[14rem]">
        <DropdownMenuLabel>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-text">{displayName}</p>
            <p className="text-xs text-text-light">{email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            void handleSignOut();
          }}
          className="text-destructive"
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
