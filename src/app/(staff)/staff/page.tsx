import { Card, CardHeader, CardSection } from "@/components/ui/card";
import { MealSlotCard } from "@/components/ui/meal-slot-card";
import { MOCK_MEAL_JOBS } from "@/lib/mock-data";

export default function StaffDashboard() {
  const todaysJobs = MOCK_MEAL_JOBS.slice(0, 2);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Staff dashboard" subtitle="Today&apos;s arrivals and departures" />
        <div className="mt-6 grid gap-4 sm:grid-cols-3 text-sm text-olive-800">
          <InfoCard label="Arrivals" value="2 groups" helper="Alpha Youth · Beta School" />
          <InfoCard label="Departures" value="1 group" helper="Guest Conference" />
          <InfoCard label="Tasks" value="3 open" helper="Coffee urn prep · AV setup" />
        </div>
      </Card>
      <Card>
        <CardHeader title="Catering run sheet preview" subtitle="Upcoming services" />
        <CardSection title="Today">
          <div className="grid gap-4 md:grid-cols-2">
            {todaysJobs.map((job) => (
              <MealSlotCard key={job.id} job={job} />
            ))}
          </div>
        </CardSection>
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
