import Link from "next/link";
import { redirect } from "next/navigation";


import { DashboardShell } from "@/components/layout/dashboard-shell";

import { getHomePathForRole } from "@/lib/auth/paths";
import { getCurrentProfile } from "@/lib/auth/server";

const navItems = [
  { href: "/caterer", label: "Dashboard" },
  { href: "/caterer/jobs", label: "My jobs" },
];

export default async function CatererLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, profile } = await getCurrentProfile();

  if (!session?.user) {
    redirect("/login");
  }

  const role = profile?.role ?? null;
  if (!role || !["caterer", "admin"].includes(role)) {
    redirect(getHomePathForRole(role, profile?.booking_reference ?? null));
  }

  return (
    <DashboardShell
      title="Caterer workspace"
      description="Manage menus, prep, and delivery timelines."
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
