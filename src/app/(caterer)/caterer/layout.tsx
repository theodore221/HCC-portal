import Link from "next/link";

import { DashboardShell } from "@/components/layout/dashboard-shell";

const navItems = [
  { href: "/caterer", label: "Dashboard" },
  { href: "/caterer/jobs", label: "My jobs" },
];

export default function CatererLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell
      title="Caterer workspace"
      description="Manage menus, prep, and delivery timelines."
      navItems={navItems}
      actions={
        <Link
          href="/caterer/jobs"
          className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-medium text-olive-800 shadow-soft transition-colors hover:bg-olive-50"
        >
          View job board
        </Link>
      }
    >
      {children}
    </DashboardShell>
  );
}
