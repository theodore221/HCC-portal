"use client";
import { toast } from 'sonner';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EnrichedMealJob } from "@/lib/catering";
import {
  InlineMenuDisplay,
  MealServesDisplay,
  PercolatedCoffeeToggle,
} from "@/components/catering";
import {
  customerUpdateMealJobItems,
  customerUpdateCoffeeRequest,
  customerUpdateMealJobServes,
} from "./actions";

interface DayMealCardProps {
  formattedDate: string;
  meals: EnrichedMealJob[];
  menuItems: {
    id: string;
    label: string;
    catererId: string | null;
    mealType: string | null;
  }[];
}

export function DayMealCard({
  formattedDate,
  meals,
  menuItems,
}: DayMealCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const completionStatus = getCompletionStatus(meals);

  const handleMenuChange = async (mealJobId: string, items: string[]) => {
    try {
      setLoading(mealJobId);
      await customerUpdateMealJobItems(mealJobId, items);
      router.refresh();
      toast.success("Menu updated");
    } catch (error) {
      toast.error("Failed to update menu");
      throw error;
    } finally {
      setLoading(null);
    }
  };

  const handleCoffeeToggle = async (
    mealJobId: string,
    checked: boolean,
    quantity: number | null
  ) => {
    try {
      await customerUpdateCoffeeRequest(mealJobId, checked, quantity);
      router.refresh();
      toast.success("Coffee request updated");
    } catch (error) {
      toast.error("Failed to update coffee");
      throw error;
    }
  };

  const handleServesUpdate = async (mealJobId: string, count: number) => {
    try {
      setLoading(mealJobId);
      await customerUpdateMealJobServes(mealJobId, count);
      router.refresh();
      toast.success("Serves updated");
    } catch (error) {
      toast.error("Failed to update serves");
      throw error;
    } finally {
      setLoading(null);
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border p-6 shadow-soft transition-colors",
        completionStatus.isComplete
          ? "border-green-200 bg-green-50/30"
          : "border-border/70 bg-white/90"
      )}
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-text">{formattedDate}</h3>
          {completionStatus.isComplete ? (
            <Badge className="gap-1.5 border-green-200 bg-green-50 text-green-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Completed
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="gap-1.5 border-orange-200 bg-orange-50 text-orange-700"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              Action Required ({completionStatus.pendingCount})
            </Badge>
          )}
        </div>
      </div>

      <div className="mb-6 border-b border-border/50" />

      <div className="space-y-6">
        {meals.map((meal, index) => {
          const isCoffeeEligible =
            meal.meal === "Morning Tea" || meal.meal === "Afternoon Tea";
          const availableMenuItems = menuItems.filter(
            (item) =>
              (!item.catererId || item.catererId === meal.assignedCatererId) &&
              (!item.mealType || item.mealType === meal.meal)
          );
          const selectedMenuLabel =
            meal.menuIds.length > 0
              ? menuItems.find((i) => i.id === meal.menuIds[0])?.label ?? null
              : null;
          const rawTimeLabel = meal.timeRangeLabel.replace(meal.meal, "").trim();
          const timeStartIndex = rawTimeLabel.search(/\d/);
          const timeLabel =
            timeStartIndex >= 0 ? rawTimeLabel.slice(timeStartIndex) : rawTimeLabel;

          return (
            <div
              key={meal.id}
              className={cn(
                "pb-6",
                index !== meals.length - 1 && "border-b border-border/50"
              )}
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text">
                        {meal.meal}
                      </span>
                      <span className="text-xs text-text-light">
                        {timeLabel}
                      </span>
                    </div>
                    {meal.assignedCaterer ? (
                      <Badge
                        variant="outline"
                        className="mt-1 border-olive-200 bg-olive-50 text-olive-700"
                      >
                        {meal.assignedCaterer}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="mt-1 border-orange-200 bg-orange-50 text-orange-700"
                      >
                        Unassigned
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <MealServesDisplay
                    count={meal.countsTotal}
                    editable={true}
                    onUpdate={(count) => handleServesUpdate(meal.id, count)}
                    disabled={loading === meal.id}
                  />
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      meal.status === "Draft"
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-olive-200 bg-olive-50 text-olive-700"
                    )}
                  >
                    {meal.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-light">
                      Menu Selection
                    </label>
                    <InlineMenuDisplay
                      selectedIds={meal.menuIds ?? []}
                      selectedLabel={selectedMenuLabel}
                      availableItems={availableMenuItems}
                      placeholder={
                        meal.assignedCatererId
                          ? "Select menu item..."
                          : "Assign caterer first"
                      }
                      onSelect={(items) => handleMenuChange(meal.id, items)}
                      disabled={!meal.assignedCatererId || loading === meal.id}
                    />
                  </div>
                </div>

                {isCoffeeEligible && (
                  <PercolatedCoffeeToggle
                    checked={meal.percolatedCoffee}
                    quantity={meal.percolatedCoffeeQuantity}
                    onToggle={(checked, qty) =>
                      handleCoffeeToggle(meal.id, checked, qty)
                    }
                    disabled={loading === meal.id}
                  />
                )}
              </div>

              {Object.keys(meal.dietaryCounts).length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
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
          );
        })}
      </div>
    </div>
  );
}

function getCompletionStatus(meals: EnrichedMealJob[]) {
  let pendingCount = 0;

  for (const meal of meals) {
    const isCoffeeEligible =
      meal.meal === "Morning Tea" || meal.meal === "Afternoon Tea";
    const hasCaterer = !!meal.assignedCatererId;
    const hasMenu = meal.menuIds && meal.menuIds.length > 0;
    const hasCoffeeConfigured =
      !isCoffeeEligible || meal.percolatedCoffee !== null;

    if (!hasCaterer || !hasMenu || !hasCoffeeConfigured) {
      pendingCount++;
    }
  }

  return {
    isComplete: pendingCount === 0,
    pendingCount,
    totalCount: meals.length,
  };
}
