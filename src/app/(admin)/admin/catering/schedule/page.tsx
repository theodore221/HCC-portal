import type { Metadata } from "next";
import { MealJobsGridCard } from "@/components/meal-jobs-grid-card";
import { enrichMealJobs } from "@/lib/catering";
import { MOCK_BOOKINGS, MOCK_MEAL_JOBS } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Catering schedule",
  description: "Coordinate the week\'s catering services and assignments.",
};

export default function AdminCateringSchedule() {
  return (
    <div className="space-y-6">
      <MealJobsGridCard
        title="Catering run sheet"
        description="Every meal service, grouped for quick review"
        jobs={enrichMealJobs(MOCK_MEAL_JOBS, MOCK_BOOKINGS)}
      />
    </div>
  );
}
