"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DayMealCard } from "./day-meal-card";
import type { EnrichedMealJob } from "@/lib/catering";
import type { DietaryProfile } from "@/lib/queries/bookings";
import type { Enums } from "@/lib/database.types";
import { CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DietaryTable } from "@/components/catering";
import { useToast } from "@/components/ui/use-toast";
import {
  createDietaryProfile,
  updateDietaryProfile,
  deleteDietaryProfile,
  updateDietaryMealAttendance,
} from "./actions";

export function CateringTab({
  meals,
  caterers,
  menuItems,
  dietaryProfiles = [],
  mealAttendance = {},
  bookingId,
}: {
  meals: EnrichedMealJob[];
  caterers: { id: string; name: string }[];
  menuItems: { id: string; label: string; catererId: string | null; mealType: string | null }[];
  dietaryProfiles?: DietaryProfile[];
  mealAttendance?: Record<string, Record<string, boolean>>;
  bookingId?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [showPendingOnly, setShowPendingOnly] = useState(false);

  // Dietary profile handlers
  const handleAddProfile = async (data: {
    personName: string;
    dietType: string;
    allergy?: string;
    severity?: Enums<"severity">;
    notes?: string;
  }) => {
    if (!bookingId) return;
    try {
      await createDietaryProfile(bookingId, data);
      router.refresh();
      toast({ title: "Dietary requirement added" });
    } catch (error) {
      toast({ title: "Failed to add dietary requirement", variant: "destructive" });
      throw error;
    }
  };

  const handleEditProfile = async (
    profileId: string,
    data: {
      personName?: string;
      dietType?: string;
      allergy?: string;
      severity?: Enums<"severity"> | null;
      notes?: string;
    }
  ) => {
    try {
      await updateDietaryProfile(profileId, data);
      router.refresh();
      toast({ title: "Dietary requirement updated" });
    } catch (error) {
      toast({ title: "Failed to update dietary requirement", variant: "destructive" });
      throw error;
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    try {
      await deleteDietaryProfile(profileId);
      router.refresh();
      toast({ title: "Dietary requirement removed" });
    } catch (error) {
      toast({ title: "Failed to remove dietary requirement", variant: "destructive" });
      throw error;
    }
  };

  const handleAttendanceChange = async (
    profileId: string,
    mealJobId: string,
    attending: boolean
  ) => {
    try {
      await updateDietaryMealAttendance(profileId, mealJobId, attending);
      router.refresh();
    } catch (error) {
      toast({ title: "Failed to update meal attendance", variant: "destructive" });
      throw error;
    }
  };

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
    const totalDays = sortedDates.length;

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
    <div className="space-y-6">
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
            All days are fully managed!
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

      {/* Dietary Requirements Section */}
      <Card className="shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-text-light">
            Dietary Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DietaryTable
            dietaryProfiles={dietaryProfiles}
            mealJobs={meals}
            mealAttendance={mealAttendance}
            onAttendanceChange={handleAttendanceChange}
            onAddProfile={bookingId ? handleAddProfile : undefined}
            onEditProfile={handleEditProfile}
            onDeleteProfile={handleDeleteProfile}
            editable={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}

