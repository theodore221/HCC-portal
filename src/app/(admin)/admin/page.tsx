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
import {
  getBookingsForAdmin,
  getBookingDisplayName,
  getAssignedMealJobs,
} from "@/lib/queries/bookings";

export default async function AdminDashboard() {
  const bookings = await getBookingsForAdmin();
  const mealJobs = await getAssignedMealJobs();
  const enrichedJobs = enrichMealJobs(mealJobs, bookings);

  const pending = bookings.filter((b) => b.status === "Pending");
  const depositPending = bookings.filter((b) => b.status === "DepositPending");
  const depositReceived = bookings.filter((b) => b.status === "DepositReceived");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Operational snapshot</CardTitle>
          <CardDescription>Today&apos;s status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Pending" value={pending.length} helper="Awaiting triage" />
            <StatCard
              label="Deposit pending"
              value={depositPending.length}
              helper="Approved but unpaid"
            />
            <StatCard
              label="Deposit received"
              value={depositReceived.length}
              helper="Customer portal unlocked"
            />
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bookings awaiting action</CardTitle>
          </CardHeader>
          <CardContent>
            {pending.length ? (
              <ul className="space-y-4">
                {pending.map((booking) => (
                  <li key={booking.id} className="rounded-xl border border-olive-100 bg-olive-50/70 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-olive-900">
                          {getBookingDisplayName(booking)}
                        </p>
                        <p className="text-xs text-olive-700">
                          {formatDateRange(booking.arrival_date, booking.departure_date)}
                        </p>
                        <p className="mt-2 text-xs text-olive-700">
                          Spaces requested: {booking.spaces.join(", ") || "TBC"}
                        </p>
                      </div>
                      <StatusChip status={booking.status} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-olive-700">No bookings waiting for triage.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Catering alerts</CardTitle>
            <CardDescription>Recent updates to meal jobs</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-semibold uppercase tracking-wide text-olive-600">
              Updated jobs
            </p>
            {enrichedJobs.length ? (
              <ul className="mt-3 space-y-3 text-sm text-olive-800">
                {enrichedJobs.slice(0, 4).map((job) => (
                  <li
                    key={job.id}
                    className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-soft"
                  >
                    <div>
                      <p className="font-semibold text-olive-900">{job.timeSlot}</p>
                      <p className="text-xs text-olive-700">
                        {job.date} · Booking {job.bookingId}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-olive-700">
                      {Object.values(job.dietaryCounts).reduce((acc, value) => acc + value, 0)} meals
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-olive-700">No catering updates yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: number;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-olive-100 bg-white p-4 shadow-soft">
      <p className="text-xs uppercase tracking-wide text-olive-600">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-olive-900">{value}</p>
      <p className="text-xs text-olive-700">{helper}</p>
    </div>
  );
}
