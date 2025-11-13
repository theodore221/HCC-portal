import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MealSlotCard } from "@/components/ui/meal-slot-card";
import { enrichMealJobs } from "@/lib/catering";
import { getBookingDisplayName } from "@/lib/queries/bookings";
import { getAssignedMealJobs, getBookingsForAdmin } from "@/lib/queries/bookings.server";

export default async function StaffDashboard() {
  const [bookings, mealJobsRaw] = await Promise.all([
    getBookingsForAdmin(),
    getAssignedMealJobs(),
  ]);
  const mealJobs = enrichMealJobs(mealJobsRaw, bookings);

  const today = new Date().toISOString().slice(0, 10);
  const arrivalsToday = bookings.filter((booking) => booking.arrival_date === today);
  const departuresToday = bookings.filter((booking) => booking.departure_date === today);
  const todaysJobs = mealJobs.filter((job) => job.date === today);

  const arrivalsLabel = arrivalsToday.length
    ? `${arrivalsToday.length} group${arrivalsToday.length === 1 ? "" : "s"}`
    : "None";
  const departuresLabel = departuresToday.length
    ? `${departuresToday.length} group${departuresToday.length === 1 ? "" : "s"}`
    : "None";

  const arrivalNames = arrivalsToday.map((booking) => getBookingDisplayName(booking)).join(" · ");
  const departureNames = departuresToday.map((booking) => getBookingDisplayName(booking)).join(" · ");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Staff dashboard</CardTitle>
          <CardDescription>Today&apos;s arrivals and departures</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 text-sm text-olive-800 sm:grid-cols-3">
            <InfoCard label="Arrivals" value={arrivalsLabel} helper={arrivalNames || "No arrivals today"} />
            <InfoCard label="Departures" value={departuresLabel} helper={departureNames || "No departures today"} />
            <InfoCard
              label="Tasks"
              value={`${todaysJobs.length} open`}
              helper="Coffee urn prep · AV setup"
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Catering run sheet preview</CardTitle>
          <CardDescription>Upcoming services</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-semibold uppercase tracking-wide text-olive-600">
            Today
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {todaysJobs.length ? (
              todaysJobs.map((job) => <MealSlotCard key={job.id} job={job} />)
            ) : (
              <p className="text-sm text-olive-700">No services scheduled for today.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-2xl border border-olive-100 bg-white p-4 shadow-soft">
      <p className="text-xs uppercase tracking-wide text-olive-600">{label}</p>
      <p className="mt-2 text-lg font-semibold text-olive-900">{value}</p>
      <p className="text-xs text-olive-700">{helper}</p>
    </div>
  );
}
