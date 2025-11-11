import type { Metadata } from "next";

import { WeekScheduleCard } from "@/components/week-schedule-card";
import { enrichMealJobs } from "@/lib/catering";
import { getAssignedMealJobs, getBookingsForAdmin } from "@/lib/queries/bookings.server";

export const metadata: Metadata = {
  title: "Schedule overview",
  description: "See spaces and catering commitments across every booking.",
};

export default async function AdminSchedule() {
  const [bookings, mealJobsRaw] = await Promise.all([
    getBookingsForAdmin(),
    getAssignedMealJobs(),
  ]);
  const mealJobs = enrichMealJobs(mealJobsRaw, bookings);

  return (
    <div className="space-y-6">
      <WeekScheduleCard
        title="Operational schedule"
        subtitle="Spaces and meal services mapped to each group"
        bookings={bookings}
        mealJobs={mealJobs}
      />
    </div>
  );
}
