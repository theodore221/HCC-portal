import type { EnrichedMealJob } from "@/lib/catering";
import { Badge } from "@/components/ui/badge";

interface DayMealCardProps {
  date: string;
  formattedDate: string;
  meals: EnrichedMealJob[];
}

export function DayMealCard({ date, formattedDate, meals }: DayMealCardProps) {
  return (
    <div className="rounded-2xl border border-border/70 bg-white/90 p-6 shadow-soft">
      {/* Date Header */}
      <h3 className="mb-4 text-lg font-semibold text-text">{formattedDate}</h3>

      {/* Meals List */}
      <div className="space-y-4">
        {meals.map((meal, index) => (
          <div
            key={meal.id}
            className={`pb-4 ${
              index !== meals.length - 1 ? "border-b border-border/50" : ""
            }`}
          >
            {/* Meal Header Row */}
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-text">
                  {meal.timeSlot}
                </span>
                <span className="text-xs text-text-light">
                  {meal.timeRangeLabel.split("•")[1]?.trim()}
                </span>
                {meal.percolatedCoffee && (
                  <Badge
                    variant="secondary"
                    className="ml-2 gap-1 bg-amber-100 text-amber-700 hover:bg-amber-100"
                  >
                    ☕ Coffee requested
                  </Badge>
                )}
              </div>
              <Badge
                variant="outline"
                className={`w-fit text-xs ${
                  meal.status === "Draft"
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-olive-200 bg-olive-50 text-olive-700"
                }`}
              >
                {meal.status}
              </Badge>
            </div>

            {/* Caterer Assignment */}
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xs font-medium text-text-light">
                Assigned:
              </span>
              <span
                className={`text-xs font-semibold ${
                  meal.assignedCaterer ? "text-olive-700" : "text-orange-600"
                }`}
              >
                {meal.assignedCaterer || "Unassigned"}
              </span>
            </div>

            {/* Menu Items */}
            {meal.menu.length > 0 && (
              <div className="mb-3">
                <span className="text-xs font-medium text-text-light">
                  Menu:{" "}
                </span>
                <span className="text-xs text-olive-700">
                  {meal.menu.join(", ")}
                </span>
              </div>
            )}

            {/* Dietary Counts */}
            {Object.keys(meal.dietaryCounts).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(meal.dietaryCounts).map(([diet, count]) => (
                  <div
                    key={diet}
                    className="flex items-center gap-2 rounded-lg bg-olive-50 px-3 py-1.5 text-xs"
                  >
                    <span className="capitalize text-olive-800">{diet}:</span>
                    <span className="font-semibold text-olive-900">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
