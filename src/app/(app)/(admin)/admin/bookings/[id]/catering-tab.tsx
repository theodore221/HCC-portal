"use client";

import { useMemo } from "react";
import { DayMealCard } from "./day-meal-card";
import type { EnrichedMealJob } from "@/lib/catering";

export function CateringTab({
  meals,
  caterers,
  menuItems,
}: {
  meals: EnrichedMealJob[];
  caterers: { id: string; name: string }[];
  menuItems: { id: string; label: string; catererId: string | null; mealType: string | null }[];
}) {
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

  if (meals.length === 0) {
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
          caterers={caterers}
          menuItems={menuItems}
        />
      ))}
    </div>
  );
}
