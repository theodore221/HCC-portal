"use client";
import { toast } from 'sonner';

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { EnrichedMealJob } from "@/lib/catering";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  assignCaterer,
  assignCatererToDay,
  updateMealJobItems,
  updateCoffeeRequest,
  updateMealJobServes,
} from "./actions";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MealServesDisplay,
  PercolatedCoffeeToggle,
  InlineMenuDisplay,
} from "@/components/catering";

interface DayMealCardProps {
  date: string;
  formattedDate: string;
  meals: EnrichedMealJob[];
  caterers: { id: string; name: string }[];
  menuItems: {
    id: string;
    label: string;
    catererId: string | null;
    mealType: string | null;
  }[];
}

export function DayMealCard({
  date,
  formattedDate,
  meals,
  caterers,
  menuItems,
}: DayMealCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [customizeMode, setCustomizeMode] = useState(false);
  const [bulkCatererId, setBulkCatererId] = useState<string>("");
  const [bulkLoading, setBulkLoading] = useState(false);

  // Calculate completion status
  const completionStatus = getCompletionStatus(meals);

  const handleBulkAssign = async () => {
    if (!bulkCatererId || bulkCatererId === "unassigned") return;

    try {
      setBulkLoading(true);
      const bookingId = meals[0]?.bookingId;
      await assignCatererToDay(date, bookingId, bulkCatererId);
      router.refresh();
      const unassignedCount = meals.filter((m) => !m.assignedCatererId).length;
      toast.success(`Assigned caterer to ${unassignedCount} meal${
          unassignedCount !== 1 ? "s" : ""
        }`);
      setBulkCatererId("");
    } catch (error) {
      toast.error("Failed to assign caterer");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleCatererChange = async (mealJobId: string, catererId: string) => {
    try {
      setLoading(mealJobId);
      await assignCaterer(
        mealJobId,
        catererId === "unassigned" ? null : catererId
      );
      router.refresh();
      toast.success("Caterer updated");
    } catch (error) {
      toast.error("Failed to update caterer");
    } finally {
      setLoading(null);
    }
  };

  const handleMenuChange = async (mealJobId: string, items: string[]) => {
    try {
      setLoading(mealJobId);
      await updateMealJobItems(mealJobId, items);
      router.refresh();
      toast.success("Menu updated");
    } catch (error) {
      toast.error("Failed to update menu");
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
      await updateCoffeeRequest(mealJobId, checked, quantity);
      router.refresh();
      toast.success("Coffee request updated");
    } catch (error) {
      toast.error("Failed to update coffee");
      throw error;
    }
  };

  const handleServesUpdate = async (mealJobId: string, count: number) => {
    try {
      await updateMealJobServes(mealJobId, count);
      router.refresh();
      toast.success("Serves updated");
    } catch (error) {
      toast.error("Failed to update serves");
      throw error;
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
      {/* Date Header with Completion Status */}
      <div className="flex items-start justify-between mb-4">
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

        {/* Bulk Assignment Controls */}
        {!customizeMode && (
          <div className="flex flex-col items-end gap-3">
            {/* Caterer Select and Assign Button */}
            <div className="flex items-center gap-2">
              <Select
                value={bulkCatererId}
                onValueChange={setBulkCatererId}
                disabled={bulkLoading}
              >
                <SelectTrigger className="h-9 w-[200px] border-border/50 bg-white shadow-soft">
                  <SelectValue placeholder="Select caterer..." />
                </SelectTrigger>
                <SelectContent>
                  {caterers.map((caterer) => (
                    <SelectItem key={caterer.id} value={caterer.id}>
                      {caterer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={handleBulkAssign}
                disabled={
                  !bulkCatererId ||
                  bulkCatererId === "unassigned" ||
                  bulkLoading
                }
                className="h-9"
              >
                {bulkLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Assign All
              </Button>
            </div>

            {/* Individual Assignment Toggle - styled like BYO Linen */}
            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-neutral-50 px-3 py-2">
              <Switch
                checked={customizeMode}
                onCheckedChange={setCustomizeMode}
                id={`customize-${date}`}
                className="scale-90"
              />
              <Label
                htmlFor={`customize-${date}`}
                className="text-xs font-medium text-text cursor-pointer"
              >
                Assign Individual Meals
              </Label>
            </div>
          </div>
        )}
      </div>

      {/* Customize Mode Header */}
      {customizeMode && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-olive-200 bg-olive-50/50 px-4 py-3">
          <span className="text-sm font-medium text-olive-900">
            Individual meal assignment enabled
          </span>
          <div className="flex items-center gap-2">
            <Switch
              checked={customizeMode}
              onCheckedChange={setCustomizeMode}
              id={`customize-${date}-active`}
              className="scale-90"
            />
            <Label
              htmlFor={`customize-${date}-active`}
              className="text-xs font-medium text-olive-900 cursor-pointer"
            >
              Exit
            </Label>
          </div>
        </div>
      )}

      {/* Separator */}
      <div className="border-b border-border/50 mb-6" />

      {/* Meals List */}
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

          return (
            <div
              key={meal.id}
              className={cn(
                "pb-6",
                index !== meals.length - 1 && "border-b border-border/50"
              )}
            >
              {/* Meal Header Row */}
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text">
                        {meal.meal}
                      </span>
                      <span className="text-xs text-text-light">
                        {meal.timeRangeLabel.split("•")[1]?.trim()}
                      </span>
                    </div>
                    {!customizeMode && meal.assignedCatererId && (
                      <Badge
                        variant="outline"
                        className="mt-1 border-olive-200 bg-olive-50 text-olive-700"
                      >
                        {caterers.find((c) => c.id === meal.assignedCatererId)?.name}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Serves Count */}
                  <MealServesDisplay
                    count={meal.countsTotal}
                    editable={true}
                    onUpdate={(count) => handleServesUpdate(meal.id, count)}
                    disabled={loading === meal.id}
                  />

                  {/* Status Badge */}
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
                {/* Caterer and Menu Row */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Caterer Assignment (only shown in customize mode) */}
                  {customizeMode && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-light">
                        Assigned Caterer
                      </label>
                      <Select
                        value={meal.assignedCatererId ?? "unassigned"}
                        onValueChange={(val) => handleCatererChange(meal.id, val)}
                        disabled={loading === meal.id}
                      >
                        <SelectTrigger className="h-9 border-border/50 bg-white">
                          <SelectValue placeholder="Select caterer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {caterers.map((caterer) => (
                            <SelectItem key={caterer.id} value={caterer.id}>
                              {caterer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Menu Items - using InlineMenuDisplay */}
                  <div className={cn("space-y-1.5", !customizeMode && "sm:col-span-2")}>
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

                {/* Coffee Option - using PercolatedCoffeeToggle */}
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

              {/* Dietary Counts */}
              {Object.keys(meal.dietaryCounts).length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {Object.entries(meal.dietaryCounts).map(([diet, count]) => (
                    <div
                      key={diet}
                      className="flex items-center gap-2 rounded-lg bg-olive-50 px-3 py-1.5 text-xs"
                    >
                      <span className="capitalize text-olive-800">{diet}:</span>
                      <span className="font-semibold text-olive-900">{count}</span>
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
