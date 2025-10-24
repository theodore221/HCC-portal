import Link from "next/link";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/schedule", label: "Schedule" },
  { href: "/admin/catering/jobs", label: "Catering Jobs" },
  { href: "/admin/catering/schedule", label: "Catering Schedule" },
  { href: "/admin/resources", label: "Resources" },
  { href: "/admin/audit", label: "Audit" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell
      title="Admin control panel"
      description="Oversee bookings, catering, and resources."
      navItems={navItems}
      quickActions={
        <Button
          asChild
          className="rounded-full bg-olive-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-olive-700"
        >
          <Link href="/admin/bookings">Quick create</Link>
        </Button>
      }
    >
      {children}
    </DashboardShell>
  );
}
