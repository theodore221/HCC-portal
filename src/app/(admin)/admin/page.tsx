import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusChip } from "@/components/ui/status-chip";
import { formatDateRange } from "@/lib/utils";
import { enrichMealJobs } from "@/lib/catering";
import { getBookingDisplayName } from "@/lib/queries/bookings";
import {
  getAssignedMealJobs,
  getBookingsForAdmin,
} from "@/lib/queries/bookings.server";
import type { LucideIcon } from "lucide-react";
import { CalendarClock, ClipboardList, Coins, Sparkles } from "lucide-react";

export default async function AdminDashboard() {
  const bookings = await getBookingsForAdmin();
  const mealJobs = await getAssignedMealJobs();
  const enrichedJobs = enrichMealJobs(mealJobs, bookings);

  const pending = bookings.filter((b) => b.status === "Pending");
  const depositPending = bookings.filter((b) => b.status === "DepositPending");
  const depositReceived = bookings.filter((b) => b.status === "DepositReceived");
  const activeCatering = enrichedJobs.length;

  const statCards = [
    {
      label: "Pending",
      value: pending.length,
      helper: "Awaiting triage",
      icon: CalendarClock,
    },
    {
      label: "Deposit pending",
      value: depositPending.length,
      helper: "Approved but unpaid",
      icon: Coins,
    },
    {
      label: "Deposit received",
      value: depositReceived.length,
      helper: "Customer portal unlocked",
      icon: ClipboardList,
    },
    {
      label: "Active catering jobs",
      value: activeCatering,
      helper: "Scheduled this week",
      icon: Sparkles,
    },
  ];

  return (
    <div className="space-y-8">
      <Card className="shadow-soft">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-text">Operational snapshot</CardTitle>
            <CardDescription className="text-sm text-text-light">Today&apos;s status</CardDescription>
          </div>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
            {bookings.length} total bookings
          </span>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg text-text">Bookings awaiting action</CardTitle>
              <CardDescription className="text-sm text-text-light">
                Prioritise urgent enquiries and respond promptly
              </CardDescription>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {pending.length} pending
            </span>
          </CardHeader>
          <CardContent>
            {pending.length ? (
              <ul className="space-y-4">
                {pending.map((booking) => (
                  <li
                    key={booking.id}
                    className="group rounded-2xl border border-border/70 bg-neutral p-4 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:bg-white hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-text">
                          {getBookingDisplayName(booking)}
                        </p>
                        <p className="text-xs text-text-light">
                          {formatDateRange(booking.arrival_date, booking.departure_date)}
                        </p>
                        <p className="mt-2 text-xs text-text-light">
                          Spaces requested: {booking.spaces.join(", ") || "TBC"}
                        </p>
                      </div>
                      <StatusChip status={booking.status} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/70 bg-neutral/60 px-6 py-12 text-center">
                <CalendarClock className="size-12 text-text-light" aria-hidden />
                <p className="text-sm font-semibold text-text">All clear for now</p>
                <p className="text-sm text-text-light">
                  There are no bookings waiting for triage. Great job staying ahead!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg text-text">Catering alerts</CardTitle>
              <CardDescription className="text-sm text-text-light">
                Recent updates to meal jobs
              </CardDescription>
            </div>
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              {enrichedJobs.length} jobs
            </span>
          </CardHeader>
          <CardContent className="space-y-4">
            {enrichedJobs.length ? (
              <ul className="space-y-3 text-sm text-text">
                {enrichedJobs.slice(0, 4).map((job) => (
                  <li
                    key={job.id}
                    className="flex items-center justify-between rounded-2xl border border-border/60 bg-white px-4 py-3 transition-all duration-200 hover:border-primary/40 hover:shadow-md"
                  >
                    <div className="space-y-1">
                      <p className="font-semibold text-text">{job.timeSlot}</p>
                      <p className="text-xs text-text-light">
                        {job.date} · Booking {job.bookingId}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-text-light">
                      {Object.values(job.dietaryCounts).reduce((acc, value) => acc + value, 0)} meals
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/70 bg-neutral/60 px-6 py-12 text-center">
                <ClipboardList className="size-12 text-text-light" aria-hidden />
                <p className="text-sm font-semibold text-text">No catering updates yet</p>
                <p className="text-sm text-text-light">
                  Meal jobs will appear here once catering requirements are confirmed.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-light">
          Quick actions
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <QuickActionCard
            title="New enquiry"
            description="Log a fresh group enquiry and assign a triage owner."
            actionLabel="Create request"
          />
          <QuickActionCard
            title="Send proposal"
            description="Generate a proposal pack with pricing and availability."
            actionLabel="Build proposal"
          />
          <QuickActionCard
            title="Schedule site visit"
            description="Coordinate an on-site inspection with the facilities team."
            actionLabel="Plan visit"
          />
          <QuickActionCard
            title="Assign catering"
            description="Confirm meal plans and communicate dietary needs."
            actionLabel="Review catering"
          />
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: number;
  helper: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-white p-5 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-light">{label}</p>
          <p className="text-3xl font-semibold text-text">{value}</p>
        </div>
      </div>
      <p className="text-sm text-text-light">{helper}</p>
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  actionLabel,
}: {
  title: string;
  description: string;
  actionLabel: string;
}) {
  return (
    <div className="flex h-full flex-col justify-between gap-4 rounded-2xl border border-border/60 bg-white/90 p-5 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-text">{title}</h3>
        <p className="text-sm text-text-light">{description}</p>
      </div>
      <button className="inline-flex items-center gap-2 text-sm font-semibold text-accent transition-colors duration-200 hover:text-accent/80">
        {actionLabel}
      </button>
    </div>
  );
}
