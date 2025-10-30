import Link from "next/link";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
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

  if (profile?.role !== "caterer") {
    redirect(getHomePathForRole(profile?.role ?? null, profile?.booking_reference ?? null));
  }

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
