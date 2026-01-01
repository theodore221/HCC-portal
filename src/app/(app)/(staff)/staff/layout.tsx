import Link from "next/link";
import { redirect } from "next/navigation";


import { DashboardShell } from "@/components/layout/dashboard-shell";

import { getHomePathForRole } from "@/lib/auth/paths";
import { getCurrentProfile } from "@/lib/auth/server";

const navItems = [
  { href: "/staff", label: "Dashboard" },
  { href: "/staff/schedule", label: "Schedule" },
  { href: "/staff/kitchen", label: "Kitchen" },
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

      user={{
        name: profile?.full_name ?? profile?.email ?? undefined,
        email: profile?.email ?? session?.user.email ?? undefined,
      }}
    >
      {children}
    </DashboardShell>
  );
}
