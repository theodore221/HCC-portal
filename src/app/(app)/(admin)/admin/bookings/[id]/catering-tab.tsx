"use client";

import { useMemo, useState } from "react";
import { DayMealCard } from "./day-meal-card";
import type { EnrichedMealJob } from "@/lib/catering";
import { CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CateringTab({
  meals,
  caterers,
  menuItems,
}: {
  meals: EnrichedMealJob[];
  caterers: { id: string; name: string }[];
  menuItems: { id: string; label: string; catererId: string | null; mealType: string | null }[];
}) {
  const [showPendingOnly, setShowPendingOnly] = useState(false);

  const mealsByDate = useMemo(() => {
    const grouped: Record<
      string,
      {
        date: string;
        formattedDate: string;
        meals: EnrichedMealJob[];
      }
    > = {};

    for (const meal of meals) {
      const dateKey = meal.date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: dateKey,
          formattedDate: meal.formattedDate,
          meals: [],
        };
      }
      grouped[dateKey].meals.push(meal);
    }

    return grouped;
  }, [meals]);

  const sortedDates = Object.keys(mealsByDate).sort();

  // Calculate overall completion
  const completionStats = useMemo(() => {
    let completedDays = 0;
    let totalDays = sortedDates.length;

    sortedDates.forEach((date) => {
      const dayMeals = mealsByDate[date].meals;
      let allComplete = true;

      for (const meal of dayMeals) {
        const isCoffeeEligible = meal.meal === "Morning Tea" || meal.meal === "Afternoon Tea";
        const hasCaterer = !!meal.assignedCatererId;
        const hasMenu = meal.menuIds && meal.menuIds.length > 0;
        const hasCoffeeConfigured = !isCoffeeEligible || (meal.percolatedCoffee !== null);

        if (!hasCaterer || !hasMenu || !hasCoffeeConfigured) {
          allComplete = false;
          break;
        }
      }

      if (allComplete) completedDays++;
    });

    return { completedDays, totalDays };
  }, [sortedDates, mealsByDate]);

  // Filter dates if needed
  const displayDates = useMemo(() => {
    if (!showPendingOnly) return sortedDates;

    return sortedDates.filter((date) => {
      const dayMeals = mealsByDate[date].meals;
      for (const meal of dayMeals) {
        const isCoffeeEligible = meal.meal === "Morning Tea" || meal.meal === "Afternoon Tea";
        const hasCaterer = !!meal.assignedCatererId;
        const hasMenu = meal.menuIds && meal.menuIds.length > 0;
        const hasCoffeeConfigured = !isCoffeeEligible || (meal.percolatedCoffee !== null);

        if (!hasCaterer || !hasMenu || !hasCoffeeConfigured) {
          return true; // Include this day
        }
      }
      return false; // All complete, exclude
    });
  }, [showPendingOnly, sortedDates, mealsByDate]);

  if (meals.length === 0) {
    return (
      <div className="rounded-2xl border border-border/70 bg-white/90 p-6 shadow-soft">
        <p className="text-sm text-text-light">
          No catering services scheduled.
        </p>
      </div>
    );
  }

  const progressPercentage = completionStats.totalDays > 0 
    ? (completionStats.completedDays / completionStats.totalDays) * 100 
    : 0;

  return (
    <div className="space-y-4">
      {/* Progress Summary */}
      <div className="rounded-2xl border border-border/70 bg-white/90 p-5 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-sm font-semibold text-text">Catering Progress</h3>
              {completionStats.completedDays === completionStats.totalDays && completionStats.totalDays > 0 ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Clock className="h-4 w-4 text-orange-500" />
              )}
            </div>
            <p className="text-xs text-text-light mb-3">
              {completionStats.completedDays} of {completionStats.totalDays} day{completionStats.totalDays !== 1 ? 's' : ''} fully managed
            </p>
            {/* Progress Bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full transition-all duration-300 ${
                  progressPercentage === 100 ? "bg-green-500" : "bg-blue-500"
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
          <Button
            variant={showPendingOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowPendingOnly(!showPendingOnly)}
            className="whitespace-nowrap"
          >
            {showPendingOnly ? "Show All Days" : "Show Pending Only"}
          </Button>
        </div>
      </div>

      {/* Days List */}
      {displayDates.length === 0 ? (
        <div className="rounded-2xl border border-border/70 bg-white/90 p-6 shadow-soft">
          <p className="text-sm text-text-light text-center">
            All days are fully managed! 🎉
          </p>
        </div>
      ) : (
        displayDates.map((date) => (
          <DayMealCard
            key={date}
            date={date}
            formattedDate={mealsByDate[date].formattedDate}
            meals={mealsByDate[date].meals}
            caterers={caterers}
            menuItems={menuItems}
          />
        ))
      )}
    </div>
  );
}

