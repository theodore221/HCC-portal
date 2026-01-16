import Link from "next/link";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";

import { getHomePathForRole } from "@/lib/auth/paths";
import { getCurrentProfile } from "@/lib/auth/server";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/schedule", label: "Schedule" },
  { href: "/admin/rooms", label: "Rooms" },
  { href: "/admin/catering/jobs", label: "Kitchen" },

  { href: "/admin/resources", label: "Resources" },
  { href: "/admin/audit", label: "Audit" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, profile } = await getCurrentProfile();

  if (!session?.user) {
    redirect("/login");
  }

  if (profile?.role !== "admin") {
    redirect(
      getHomePathForRole(
        profile?.role ?? null,
        profile?.booking_reference ?? null
      )
    );
  }

  return (
    <DashboardShell
      title="Admin control panel"
      description="Oversee bookings, catering, and resources."
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
