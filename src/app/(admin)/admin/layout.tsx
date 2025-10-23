import Link from "next/link";

import { DashboardShell } from "@/components/layout/dashboard-shell";

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
      actions={
        <Link
          href="/admin/bookings"
          className="inline-flex items-center justify-center rounded-full bg-olive-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-olive-700"
        >
          Quick create
        </Link>
      }
    >
      {children}
    </DashboardShell>
  );
}
