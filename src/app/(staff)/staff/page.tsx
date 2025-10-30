import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MealSlotCard } from "@/components/ui/meal-slot-card";
import { getAssignedMealJobs } from "@/lib/queries/bookings";
import { enrichMealJobs } from "@/lib/catering";

export default async function StaffDashboard() {
  const jobs = await getAssignedMealJobs();
  const enrichedJobs = enrichMealJobs(jobs);
  const today = new Date().toISOString().slice(0, 10);
  const todaysJobs = enrichedJobs.filter((job) => job.date === today);
  const displayJobs = todaysJobs.length ? todaysJobs : enrichedJobs.slice(0, 2);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Staff dashboard</CardTitle>
          <CardDescription>Today&apos;s arrivals and departures</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 text-sm text-olive-800 sm:grid-cols-3">
            <InfoCard label="Arrivals" value="2 groups" helper="Alpha Youth · Beta School" />
            <InfoCard label="Departures" value="1 group" helper="Guest Conference" />
            <InfoCard label="Tasks" value="3 open" helper="Coffee urn prep · AV setup" />
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
            {displayJobs.length ? (
              displayJobs.map((job) => <MealSlotCard key={job.id} job={job} />)
            ) : (
              <p className="text-sm text-olive-700">No catering services scheduled.</p>
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
