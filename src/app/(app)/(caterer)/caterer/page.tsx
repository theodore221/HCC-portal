import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MealSlotCard } from "@/components/ui/meal-slot-card";
import { enrichMealJobs } from "@/lib/catering";
import { getAssignedMealJobs, getBookingsForAdmin } from "@/lib/queries/bookings.server";

export default async function CatererDashboard() {
  const today = new Date().toISOString().slice(0, 10);
  const [bookings, mealJobsRaw] = await Promise.all([
    getBookingsForAdmin({ excludeCancelled: true }),
    getAssignedMealJobs(undefined, { limit: 10, dateFrom: today }),
  ]);
  const upcoming = enrichMealJobs(mealJobsRaw, bookings).slice(0, 3);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Caterer dashboard</CardTitle>
          <CardDescription>Today&apos;s services</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-semibold uppercase tracking-wide text-olive-600">
            On deck
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {upcoming.length ? (
              upcoming.map((job) => <MealSlotCard key={job.id} job={job} />)
            ) : (
              <p className="text-sm text-olive-700">No upcoming services assigned.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
