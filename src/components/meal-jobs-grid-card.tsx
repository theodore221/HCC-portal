import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MealSlotCard } from "@/components/ui/meal-slot-card";
import { MOCK_MEAL_JOBS, type MealJob } from "@/lib/mock-data";

interface MealJobsGridCardProps {
  title?: string;
  description?: string;
  jobs?: MealJob[];
}

export function MealJobsGridCard({
  title = "Upcoming week",
  description = "Meals assigned to you",
  jobs = MOCK_MEAL_JOBS,
}: MealJobsGridCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {jobs.map((job) => (
            <MealSlotCard key={job.id} job={job} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
