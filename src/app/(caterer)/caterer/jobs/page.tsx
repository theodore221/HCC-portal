import { Card, CardHeader, CardSection } from "@/components/ui/card";
import { MealSlotCard } from "@/components/ui/meal-slot-card";
import { Button } from "@/components/ui/button";
import { MOCK_MEAL_JOBS } from "@/lib/mock-data";

export default function CatererJobs() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="My jobs" subtitle="Confirm service readiness" />
        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-olive-700">
          <Button variant="outline">Export run sheet</Button>
          <Button variant="ghost">Mark as served</Button>
        </div>
      </Card>
      <Card>
        <CardSection title="Upcoming week">
          <div className="grid gap-4 md:grid-cols-2">
            {MOCK_MEAL_JOBS.map((job) => (
              <MealSlotCard key={job.id} job={job} />
            ))}
          </div>
        </CardSection>
      </Card>
    </div>
  );
}
