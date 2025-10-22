import Link from "next/link";
import { Card, CardHeader, CardSection } from "@/components/ui/card";
import { buttonStyles } from "@/components/ui/button";
import { MOCK_BOOKINGS } from "@/lib/mock-data";
import { StatusChip } from "@/components/ui/status-chip";
import { formatDateRange } from "@/lib/utils";

export default function HomePage() {
  const upcoming = MOCK_BOOKINGS.filter((booking) =>
    ["Approved", "DepositReceived", "InProgress"].includes(booking.status)
  ).slice(0, 3);

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
      <section className="space-y-6">
        <Card>
          <CardHeader
            title="Welcome back"
            subtitle="Choose a workspace to continue managing bookings"
            action={
              <Link href="/admin/bookings" className={buttonStyles()}>
                Go to Admin
              </Link>
            }
          />
          <CardSection title="Quick switches">
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/admin/bookings"
                className="group flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-soft transition hover:-translate-y-0.5"
              >
                <div>
                  <p className="text-sm font-semibold text-olive-900">Admin workspace</p>
                  <p className="text-xs text-olive-700">Bookings · Catering Jobs · Resources</p>
                </div>
                <span className="text-lg">→</span>
              </Link>
              <Link
                href="/staff"
                className="group flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-soft transition hover:-translate-y-0.5"
              >
                <div>
                  <p className="text-sm font-semibold text-olive-900">Staff workspace</p>
                  <p className="text-xs text-olive-700">Schedules · Run sheets</p>
                </div>
                <span className="text-lg">→</span>
              </Link>
              <Link
                href="/caterer/jobs"
                className="group flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-soft transition hover:-translate-y-0.5"
              >
                <div>
                  <p className="text-sm font-semibold text-olive-900">Caterer workspace</p>
                  <p className="text-xs text-olive-700">Assigned jobs & acknowledgements</p>
                </div>
                <span className="text-lg">→</span>
              </Link>
              <Link
                href="/portal/HCC-2411-ALPHA"
                className="group flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-soft transition hover:-translate-y-0.5"
              >
                <div>
                  <p className="text-sm font-semibold text-olive-900">Customer portal preview</p>
                  <p className="text-xs text-olive-700">Deposit · Catering · Rooming wizard</p>
                </div>
                <span className="text-lg">→</span>
              </Link>
            </div>
          </CardSection>
        </Card>
      </section>
      <aside className="space-y-4">
        <Card>
          <CardHeader title="Upcoming groups" subtitle="Next arrivals on site" />
          <ul className="mt-6 space-y-4">
            {upcoming.map((booking) => (
              <li
                key={booking.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-olive-100 bg-olive-50/80 p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-olive-900">
                    {booking.groupName}
                  </p>
                  <p className="text-xs text-olive-700">
                    {formatDateRange(booking.arrival, booking.departure)}
                  </p>
                  <p className="mt-2 text-xs text-olive-700">
                    {booking.headcount} guests · Spaces: {booking.spaces.join(", ")}
                  </p>
                </div>
                <StatusChip status={booking.status} />
              </li>
            ))}
          </ul>
        </Card>
      </aside>
    </div>
  );
}
