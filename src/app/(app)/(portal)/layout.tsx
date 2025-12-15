import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getHomePathForRole } from "@/lib/auth/paths";
import { getCurrentProfile } from "@/lib/auth/server";

const navItems = [{ href: "/portal", label: "My Bookings" }];

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, profile } = await getCurrentProfile();

  if (!session?.user) {
    redirect("/login");
  }

  if (profile?.role !== "customer") {
    redirect(
      getHomePathForRole(
        profile?.role ?? null,
        profile?.booking_reference ?? null
      )
    );
  }

  return (
    <DashboardShell
      title="Customer Portal"
      description="Manage your bookings and requests."
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
