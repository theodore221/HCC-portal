"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserCheck, FileText, CalendarOff } from "lucide-react";

const TABS = [
  { href: "/staff/rostering/my-shifts", label: "My Shifts", icon: UserCheck },
  { href: "/staff/rostering/timesheet", label: "Timesheet", icon: FileText },
  { href: "/staff/rostering/unavailability", label: "Unavailability", icon: CalendarOff },
];

export function StaffRosteringTabs() {
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
