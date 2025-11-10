import Link from "next/link";
import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { getCurrentProfile } from "@/lib/auth/server";
import {
  getBookingDisplayName,
  getBookingsForAdmin,
} from "@/lib/queries/bookings";
import { formatDateRange } from "@/lib/utils";

export default async function HomePage() {
  const { session } = await getCurrentProfile();

  if (!session) {
    redirect("/login?redirect=/");
  }

  const bookings = await getBookingsForAdmin();
  const upcoming = bookings
    .filter((booking) =>
      ["Approved", "DepositReceived", "InProgress"].includes(booking.status),
    )
    .slice(0, 3);

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
      <section className="space-y-6">
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Welcome back</CardTitle>
              <CardDescription>
                Choose a workspace to continue managing bookings
              </CardDescription>
            </div>
            <Link href="/admin/bookings" className={buttonVariants()}>
              Go to Admin
            </Link>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-semibold uppercase tracking-wide text-olive-600">
              Quick switches
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-center justify-between rounded-xl border border-olive-100 bg-white px-4 py-3 shadow-soft transition hover:-translate-y-0.5"
                >
                  <div>
                    <p className="text-sm font-semibold text-olive-900">{link.title}</p>
                    <p className="text-xs text-olive-700">{link.subtitle}</p>
                  </div>
                  <span
                    aria-hidden
                    className="text-lg text-olive-400 transition group-hover:translate-x-1"
                  >
                    →
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
      <aside className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming groups</CardTitle>
            <CardDescription>Next arrivals on site</CardDescription>
          </CardHeader>
          <CardContent>
            {upcoming.length ? (
              <ul className="space-y-4">
                {upcoming.map((booking) => (
                  <li
                    key={booking.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-olive-100 bg-olive-50/80 p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-olive-900">
                        {getBookingDisplayName(booking)}
                      </p>
                      <p className="text-xs text-olive-700">
                        {formatDateRange(booking.arrival_date, booking.departure_date)}
                      </p>
                      <p className="mt-2 text-xs text-olive-700">
                        {booking.headcount} guests · Spaces: {booking.spaces.join(", ") || "TBC"}
                      </p>
                    </div>
                    <StatusChip status={booking.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-olive-700">
                No confirmed groups scheduled yet.
              </p>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

const quickLinks = [
  {
    href: "/admin/bookings",
    title: "Admin workspace",
    subtitle: "Bookings · Catering Jobs · Resources",
  },
  {
    href: "/staff",
    title: "Staff workspace",
    subtitle: "Schedules · Run sheets",
  },
  {
    href: "/caterer/jobs",
    title: "Caterer workspace",
    subtitle: "Assigned jobs & acknowledgements",
  },
  {
    href: "/portal/HCC-2411-ALPHA",
    title: "Customer portal preview",
    subtitle: "Deposit · Catering · Rooming wizard",
  },
];
