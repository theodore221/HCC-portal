import type { Metadata } from "next";
import { WeekScheduleCard } from "@/components/week-schedule-card";
import { MOCK_BOOKINGS, MOCK_MEAL_JOBS } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Schedule overview",
  description: "See spaces and catering commitments across every booking.",
};

export default function AdminSchedule() {
  return (
    <div className="space-y-6">
      <WeekScheduleCard
        title="Operational schedule"
        subtitle="Spaces and meal services mapped to each group"
        bookings={MOCK_BOOKINGS}
        mealJobs={MOCK_MEAL_JOBS}
      />
    </div>
  );
}
