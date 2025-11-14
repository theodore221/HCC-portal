import Link from "next/link";
import { redirect } from "next/navigation";
import { UtensilsCrossed } from "lucide-react";

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

  const role = profile?.role ?? null;
  if (!role || !["caterer", "admin"].includes(role)) {
    redirect(getHomePathForRole(role, profile?.booking_reference ?? null));
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
          className="rounded-xl border-border bg-white px-4 py-2 text-sm font-semibold text-text hover:bg-neutral"
        >
          <Link href="/caterer/jobs">
            <UtensilsCrossed className="size-4" />
            View job board
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
