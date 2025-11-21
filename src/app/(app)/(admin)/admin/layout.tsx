import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { getHomePathForRole } from "@/lib/auth/paths";
import { getCurrentProfile } from "@/lib/auth/server";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/schedule", label: "Schedule" },
  { href: "/admin/catering/jobs", label: "Catering Jobs" },
  { href: "/admin/catering/schedule", label: "Catering Schedule" },
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
    redirect(getHomePathForRole(profile?.role ?? null, profile?.booking_reference ?? null));
  }

  return (
    <DashboardShell
      title="Admin control panel"
      description="Oversee bookings, catering, and resources."
      navItems={navItems}
      quickActions={
        <Button asChild className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90">
          <Link href="/admin/bookings">
            <Plus className="size-4" />
            New booking
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
