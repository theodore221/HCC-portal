import { Card, CardHeader, CardSection } from "@/components/ui/card";
import { MealSlotCard } from "@/components/ui/meal-slot-card";
import { MOCK_MEAL_JOBS } from "@/lib/mock-data";

export default function CatererDashboard() {
  const upcoming = MOCK_MEAL_JOBS.slice(0, 3);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Caterer dashboard" subtitle="Today&apos;s services" />
        <CardSection title="On deck">
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.map((job) => (
              <MealSlotCard key={job.id} job={job} />
            ))}
          </div>
        </CardSection>
      </Card>
    </div>
  );
}
