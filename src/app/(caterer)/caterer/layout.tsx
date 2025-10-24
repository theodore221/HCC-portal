import Link from "next/link";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";

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
      quickActions={
        <Button
          asChild
          variant="outline"
          className="rounded-full border-olive-200 bg-white px-4 py-2 text-sm font-medium text-olive-800 shadow-soft transition-colors hover:bg-olive-50"
        >
          <Link href="/caterer/jobs">View job board</Link>
        </Button>
      }
    >
      {children}
    </DashboardShell>
  );
}
