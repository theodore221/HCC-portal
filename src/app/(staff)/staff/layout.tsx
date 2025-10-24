import Link from "next/link";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/staff", label: "Dashboard" },
  { href: "/staff/schedule", label: "Schedule" },
];

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell
      title="Staff workspace"
      description="Track daily tasks and schedules."
      navItems={navItems}
      quickActions={
        <Button
          asChild
          variant="outline"
          className="rounded-full border-olive-200 px-4 py-2 text-sm font-medium text-olive-700 transition-colors hover:bg-olive-50"
        >
          <Link href="/staff/run-sheets/bkg_001/2025-11-13">Run sheets</Link>
        </Button>
      }
    >
      {children}
    </DashboardShell>
  );
}
