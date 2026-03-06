"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Calendar, Users, UtensilsCrossed, Leaf } from "lucide-react";

const TABS = [
  { href: "/admin/catering/jobs", label: "Jobs", icon: Calendar },
  { href: "/admin/catering/caterers", label: "Caterers", icon: Users },
  { href: "/admin/catering/menu", label: "Menu Items", icon: UtensilsCrossed },
  { href: "/admin/catering/dietaries", label: "Dietaries", icon: Leaf },
];

export function CateringTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-gray-200 pb-0 mb-6 overflow-x-auto">
      {TABS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors whitespace-nowrap",
              isActive
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
