import type { EnrichedMealJob } from "@/lib/catering";
import { DayMealCard } from "./day-meal-card";

interface CateringTabProps {
  mealJobs: EnrichedMealJob[];
}

export function CateringTab({ mealJobs }: CateringTabProps) {
  // Group meals by date
  const mealsByDate = mealJobs.reduce((acc, meal) => {
    if (!acc[meal.date]) {
      acc[meal.date] = {
        formattedDate: meal.formattedDate,
        meals: [],
      };
    }
    acc[meal.date].meals.push(meal);
    return acc;
  }, {} as Record<string, { formattedDate: string; meals: EnrichedMealJob[] }>);

  // Sort dates chronologically
  const sortedDates = Object.keys(mealsByDate).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  if (mealJobs.length === 0) {
    return (
      <div className="rounded-2xl border border-border/70 bg-white/90 p-6 shadow-soft">
        <p className="text-sm text-text-light">
          No catering services scheduled.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedDates.map((date) => (
        <DayMealCard
          key={date}
          date={date}
          formattedDate={mealsByDate[date].formattedDate}
          meals={mealsByDate[date].meals}
        />
      ))}
    </div>
  );
}
