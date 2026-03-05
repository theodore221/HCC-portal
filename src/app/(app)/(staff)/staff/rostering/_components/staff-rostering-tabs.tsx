"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/staff/rostering/my-shifts", label: "My Shifts" },
  { href: "/staff/rostering/timesheet", label: "Timesheet" },
  { href: "/staff/rostering/unavailability", label: "Unavailability" },
];

export function StaffRosteringTabs() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-all",
              isActive
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
