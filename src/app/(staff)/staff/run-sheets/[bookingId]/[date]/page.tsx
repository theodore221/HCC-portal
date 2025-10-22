import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MealSlotCard } from "@/components/ui/meal-slot-card";
import { MOCK_BOOKINGS, MOCK_MEAL_JOBS, MOCK_DIETARIES } from "@/lib/mock-data";

export default function RunSheet({
  params,
}: {
  params: { bookingId: string; date: string };
}) {
  const booking = MOCK_BOOKINGS.find((b) => b.id === params.bookingId);
  if (!booking) return notFound();
  const meals = MOCK_MEAL_JOBS.filter(
    (job) => job.bookingId === booking.id && job.date === params.date
  );

  return (
    <div className="space-y-6 print:bg-white">
      <Card className="print:shadow-none">
        <CardHeader>
          <CardTitle>{`Run sheet · ${booking.groupName}`}</CardTitle>
          <CardDescription>{`${params.date} · ${booking.headcount} guests`}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-olive-600">
              Fatal allergies
            </h3>
            <div className="rounded-xl border border-red-200 bg-red-50/70 p-4 text-sm text-red-800">
              {MOCK_DIETARIES.filter((d) => d.severity === "Fatal").map((dietary) => (
                <p key={dietary.name} className="font-semibold">
                  {dietary.name} — {dietary.allergy}
                </p>
              ))}
            </div>
          </section>
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-olive-600">
              Services
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {meals.length ? (
                meals.map((job) => <MealSlotCard key={job.id} job={job} />)
              ) : (
                <p className="text-sm text-olive-700">No services scheduled for this day.</p>
              )}
            </div>
          </section>
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-olive-600">
              Coffee checklist
            </h3>
            <ul className="space-y-2 text-sm text-olive-800">
              {meals.filter((job) => job.percolatedCoffee).map((job) => (
                <li key={job.id} className="flex items-center justify-between rounded-xl border border-olive-100 bg-white px-4 py-3">
                  <span>{job.timeSlot} · Prepare urn 15 min prior</span>
                  <span className="text-xs uppercase tracking-wide text-olive-600">Open</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-olive-600">
              Notes
            </h3>
            <p className="rounded-xl border border-dashed border-olive-200 bg-white p-4 text-sm text-olive-700">
              Record incidents, feedback or follow-up tasks here after service.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
