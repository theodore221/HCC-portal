import { WeekScheduleCard } from "@/components/week-schedule-card";
import { getBookingsForAdmin, getAssignedMealJobs } from "@/lib/queries/bookings";
import { toBookingSummaries } from "@/lib/mappers";
import { enrichMealJobs } from "@/lib/catering";

export default async function StaffSchedule() {
  const bookings = await getBookingsForAdmin();
  const bookingSummaries = toBookingSummaries(bookings);
  const jobs = await getAssignedMealJobs();
  const enrichedJobs = enrichMealJobs(jobs);

  return (
    <div className="space-y-6">
      <WeekScheduleCard
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
