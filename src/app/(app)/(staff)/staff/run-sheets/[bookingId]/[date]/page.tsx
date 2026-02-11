import { notFound } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MealSlotCard } from "@/components/ui/meal-slot-card";
import { enrichMealJobs } from "@/lib/catering";
import { getBookingDisplayName } from "@/lib/queries/bookings";
import {
  getBookingById,
  getDietaryProfilesForBooking,
  getMealJobsForBooking,
} from "@/lib/queries/bookings.server";

export default async function RunSheet({
  params,
}: {
  params: { bookingId: string; date: string };
}) {
  const booking = await getBookingById(params.bookingId);
  if (!booking) return notFound();

  const [mealJobsRaw, dietaryProfiles] = await Promise.all([
    getMealJobsForBooking(booking.id),
    getDietaryProfilesForBooking(booking.id),
  ]);
  const mealJobs = enrichMealJobs(mealJobsRaw, [booking]).filter(
    (job) => job.date === params.date,
  );

  const fatalAllergies = dietaryProfiles.filter((profile) => profile.severity === "Fatal");

  return (
    <div className="space-y-6 print:bg-white">
      <Card className="print:shadow-none">
        <CardHeader>
          <CardTitle>{`Run sheet · ${getBookingDisplayName(booking)}`}</CardTitle>
          <CardDescription>{`${params.date} · ${booking.headcount} guests`}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-olive-600">
              Fatal allergies
            </h3>
            <div className="rounded-xl border border-red-200 bg-red-50/70 p-4 text-sm text-red-800">
              {fatalAllergies.length ? (
                fatalAllergies.map((dietary) => (
                  <p key={dietary.id} className="font-semibold">
                    {dietary.person_name} — {dietary.allergy ?? "Unknown allergen"}
                  </p>
                ))
              ) : (
                <p>No fatal allergies recorded.</p>
              )}
            </div>
          </section>
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-olive-600">
              Services
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {mealJobs.length ? (
                mealJobs.map((job) => <MealSlotCard key={job.id} job={job} />)
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
              {mealJobs.filter((job) => job.percolatedCoffee).map((job) => (
                <li key={job.id} className="flex items-center justify-between rounded-xl border border-olive-100 bg-white px-4 py-3">
                  <span>{job.timeSlot} · Prepare urn 15 min prior</span>
                  <span className="text-xs uppercase tracking-wide text-olive-600">Open</span>
                </li>
              ))}
              {!mealJobs.some((job) => job.percolatedCoffee) && (
                <li className="rounded-xl border border-olive-100 bg-white px-4 py-3 text-xs text-olive-600">
                  No coffee services today.
                </li>
              )}
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
