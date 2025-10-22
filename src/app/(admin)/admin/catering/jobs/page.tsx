import { Card, CardHeader, CardSection } from "@/components/ui/card";
import { MealSlotCard } from "@/components/ui/meal-slot-card";
import { Button } from "@/components/ui/button";
import { MOCK_MEAL_JOBS } from "@/lib/mock-data";

export default function AdminCateringJobs() {
  const today = new Date().toISOString().slice(0, 10);
  const todaysJobs = MOCK_MEAL_JOBS.filter((job) => job.date === today);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Catering jobs" subtitle="Assign caterers and export run sheets" />
        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-olive-700">
          <Button>Assign caterer</Button>
          <Button variant="outline">Export run sheets</Button>
        </div>
      </Card>
      <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
        <Card>
          <CardSection title="Week view">
            <div className="space-y-3 text-sm text-olive-800">
              {MOCK_MEAL_JOBS.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-xl border border-olive-100 bg-white px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-olive-900">{job.date}</p>
                    <p className="text-xs text-olive-700">{job.timeSlot}</p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-medium text-olive-700">{job.assignedCaterer}</p>
                    <p>{Object.values(job.dietaryCounts).reduce((acc, val) => acc + val, 0)} meals</p>
                  </div>
                </div>
              ))}
            </div>
          </CardSection>
        </Card>
        <Card>
          <CardHeader title="Today" subtitle="{todaysJobs.length} services" />
          <CardSection title="Jobs">
            {todaysJobs.length ? (
              <div className="space-y-3">
                {todaysJobs.map((job) => (
                  <MealSlotCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-olive-700">No catering services scheduled today.</p>
            )}
          </CardSection>
        </Card>
      </div>
    </div>
  );
}
