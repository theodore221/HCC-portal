import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MealSlotCard } from "@/components/ui/meal-slot-card";
import { MOCK_MEAL_JOBS } from "@/lib/mock-data";

export default function CatererDashboard() {
  const upcoming = MOCK_MEAL_JOBS.slice(0, 3);

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
            {upcoming.map((job) => (
              <MealSlotCard key={job.id} job={job} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
