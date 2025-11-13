import { Metadata } from "next";

import { MealJobsGridCard } from "@/components/meal-jobs-grid-card";
import { enrichMealJobs } from "@/lib/catering";
import {
  getAssignedMealJobs,
  getBookingsForAdmin,
} from "@/lib/queries/bookings.server";

export const metadata: Metadata = {
  title: "Caterer jobs",
};

export default async function CatererJobsPage() {
  const [bookings, mealJobsRaw] = await Promise.all([
    getBookingsForAdmin(),
    getAssignedMealJobs(),
  ]);
  const jobs = enrichMealJobs(mealJobsRaw, bookings);

  return (
    <div className="space-y-6">
      <MealJobsGridCard
        title="Upcoming week"
        description="Meals assigned to you"
        jobs={jobs}
        emptyMessage="No catering services scheduled."
      />
    </div>
  );
}
