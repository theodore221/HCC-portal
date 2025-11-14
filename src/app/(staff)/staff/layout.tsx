import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardList } from "lucide-react";

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
          className="rounded-xl border-border px-4 py-2 text-sm font-semibold text-text hover:bg-neutral"
        >
          <Link href="/staff/run-sheets/bkg_001/2025-11-13">
            <ClipboardList className="size-4" />
            Run sheets
          </Link>
        </Button>
      }
      user={{
        name: profile?.full_name ?? profile?.email ?? undefined,
        email: profile?.email ?? session?.user.email ?? undefined,
      }}
    >
      {children}
    </DashboardShell>
  );
}
