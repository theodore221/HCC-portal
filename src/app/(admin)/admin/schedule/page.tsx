import type { Metadata } from "next";
import { WeekScheduleCard } from "@/components/week-schedule-card";
import { getBookingsForAdmin, getAssignedMealJobs } from "@/lib/queries/bookings";
import { toBookingSummaries } from "@/lib/mappers";
import { enrichMealJobs } from "@/lib/catering";

export const metadata: Metadata = {
  title: "Schedule overview",
  description: "See spaces and catering commitments across every booking.",
};

export default async function AdminSchedule() {
  const bookings = await getBookingsForAdmin();
  const bookingSummaries = toBookingSummaries(bookings);
  const jobs = await getAssignedMealJobs();
  const enrichedJobs = enrichMealJobs(jobs);

  return (
    <div className="space-y-6">
      <WeekScheduleCard
        title="Operational schedule"
        subtitle="Spaces and meal services mapped to each group"
        bookings={bookingSummaries.map((booking) => ({
          id: booking.id,
          groupName: booking.groupName,
          spaces: booking.spaces,
        }))}
        mealJobs={enrichedJobs}
      />
    </div>
  );
}
