import Link from "next/link";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { getHomePathForRole } from "@/lib/auth/paths";
import { getCurrentProfile } from "@/lib/auth/server";

const navItems = [
  { href: "/staff", label: "Dashboard" },
  { href: "/staff/schedule", label: "Schedule" },
];

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, profile } = await getCurrentProfile();

  if (!session?.user) {
    redirect("/login");
  }

  const role = profile?.role ?? null;
  if (!role || !["staff", "admin"].includes(role)) {
    redirect(getHomePathForRole(role, profile?.booking_reference ?? null));
  }

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
