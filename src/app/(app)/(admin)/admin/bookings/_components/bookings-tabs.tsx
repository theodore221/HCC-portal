"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Calendar, MessageSquare } from "lucide-react";

const TABS = [
  { href: "/admin/bookings", label: "Bookings", icon: Calendar },
  { href: "/admin/enquiries", label: "Enquiries", icon: MessageSquare },
];

// Only show on the list pages, not detail/sub pages
const LIST_PAGES = ["/admin/bookings", "/admin/enquiries"];

export function BookingsTabs() {
  const pathname = usePathname();

  if (!LIST_PAGES.includes(pathname)) return null;

  return (
    <nav className="flex gap-1 border-b border-gray-200 pb-0 mb-6 overflow-x-auto">
      {TABS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
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
