import { WeekScheduleCard } from "@/components/week-schedule-card";
import { enrichMealJobs } from "@/lib/catering";
import { getAssignedMealJobs, getBookingsForAdmin } from "@/lib/queries/bookings";

export default async function StaffSchedule() {
  const [bookings, mealJobsRaw] = await Promise.all([
    getBookingsForAdmin(),
    getAssignedMealJobs(),
  ]);
  const mealJobs = enrichMealJobs(mealJobsRaw, bookings);

  return (
    <div className="space-y-6">
      <WeekScheduleCard bookings={bookings} mealJobs={mealJobs} />
    </div>
  );
}
