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

export default async function CatererDashboard() {
  const jobs = await getAssignedMealJobs();
  const enrichedJobs = enrichMealJobs(jobs).slice(0, 3);

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
            {enrichedJobs.length ? (
              enrichedJobs.map((job) => <MealSlotCard key={job.id} job={job} />)
            ) : (
              <p className="text-sm text-olive-700">No upcoming services assigned yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
