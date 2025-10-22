import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MealSlotCard } from "@/components/ui/meal-slot-card";
import { Button } from "@/components/ui/button";
import { MOCK_MEAL_JOBS } from "@/lib/mock-data";

export default function CatererJobs() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>My jobs</CardTitle>
            <CardDescription>Confirm service readiness</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline">Export run sheet</Button>
            <Button variant="ghost">Mark as served</Button>
          </div>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Upcoming week</CardTitle>
          <CardDescription>Meals assigned to you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {MOCK_MEAL_JOBS.map((job) => (
              <MealSlotCard key={job.id} job={job} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
