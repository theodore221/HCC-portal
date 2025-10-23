import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MealJobsGridCard } from "@/components/meal-jobs-grid-card";
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
      <MealJobsGridCard
        title="Upcoming week"
        description="Meals assigned to you"
        jobs={MOCK_MEAL_JOBS}
      />
    </div>
  );
}
