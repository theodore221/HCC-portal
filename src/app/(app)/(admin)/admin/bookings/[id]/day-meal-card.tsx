"use client";

import { useState, useEffect, useRef } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/multi-select";
import { assignCaterer, updateMealJobItems, updateCoffeeRequest } from "./actions";
import { useToast } from "@/components/ui/use-toast";

interface DayMealCardProps {
  date: string;
  formattedDate: string;
  meals: EnrichedMealJob[];
  caterers: { id: string; name: string }[];
  menuItems: { id: string; label: string; catererId: string | null; mealType: string | null }[];
}

export function DayMealCard({ date, formattedDate, meals, caterers, menuItems }: DayMealCardProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleCatererChange = async (mealJobId: string, catererId: string) => {
    try {
      setLoading(mealJobId);
      await assignCaterer(mealJobId, catererId === "unassigned" ? null : catererId);
      router.refresh();
      toast({ title: "Caterer updated" });
    } catch (error) {
      toast({ title: "Failed to update caterer", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const handleMenuChange = async (mealJobId: string, items: string[]) => {
    try {
      setLoading(mealJobId);
      await updateMealJobItems(mealJobId, items);
      toast({ title: "Menu updated" });
    } catch (error) {
      toast({ title: "Failed to update menu", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="rounded-2xl border border-border/70 bg-white/90 p-6 shadow-soft">
      {/* Date Header */}
      <h3 className="mb-4 text-lg font-semibold text-text">{formattedDate}</h3>

      {/* Meals List */}
      <div className="space-y-6">
        {meals.map((meal, index) => {
          const isCoffeeEligible = meal.meal === "Morning Tea" || meal.meal === "Afternoon Tea";
          const availableMenuItems = menuItems.filter(
            (item) =>
              (!item.catererId || item.catererId === meal.assignedCatererId) &&
              (!item.mealType || item.mealType === meal.meal)
          );

          return (
            <div
              key={meal.id}
              className={`pb-6 ${
                index !== meals.length - 1 ? "border-b border-border/50" : ""
              }`}
            >
              {/* Meal Header Row */}
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text">
                    {meal.timeSlot}
                  </span>
                  <span className="text-xs text-text-light">
                    {meal.timeRangeLabel.split("•")[1]?.trim()}
                  </span>
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

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Caterer Assignment */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-light">
                    Assigned Caterer
                  </label>
                  <Select
                    value={meal.assignedCatererId ?? "unassigned"}
                    onValueChange={(val) => handleCatererChange(meal.id, val)}
                    disabled={loading === meal.id}
                  >
                    <SelectTrigger className="h-9">
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

                {/* Menu Items */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-light">
                    Menu Selection
                  </label>
                  <Select
                    value={meal.menuIds?.[0] ?? "none"}
                    onValueChange={(val) => handleMenuChange(meal.id, val === "none" ? [] : [val])}
                    disabled={!meal.assignedCatererId || loading === meal.id}
                  >
                    <SelectTrigger className={`h-9 ${!meal.assignedCatererId ? "opacity-50" : ""}`}>
                      <SelectValue placeholder={
                        meal.assignedCatererId
                          ? "Select item..."
                          : "Assign caterer first"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {availableMenuItems.length > 0 ? (
                        availableMenuItems.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.label}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="py-2 px-2 text-sm text-muted-foreground text-center">
                          {meal.assignedCatererId
                            ? `No ${meal.meal} items found for ${caterers.find(c => c.id === meal.assignedCatererId)?.name}`
                            : "No items found"}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Coffee Option */}
                {isCoffeeEligible && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-light">
                      Percolated Coffee ($3pp)
                    </label>
                    <CoffeeControl
                      mealJobId={meal.id}
                      initialChecked={meal.percolatedCoffee}
                      initialQuantity={meal.percolatedCoffeeQuantity}
                      disabled={loading === meal.id}
                    />
                  </div>
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

function CoffeeControl({
  mealJobId,
  initialChecked,
  initialQuantity,
  disabled,
}: {
  mealJobId: string;
  initialChecked: boolean;
  initialQuantity: number | null;
  disabled: boolean;
}) {
  const [checked, setChecked] = useState(initialChecked);
  const [quantity, setQuantity] = useState<string>(
    initialQuantity?.toString() ?? "20"
  );
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!checked) return;
    
    // Don't save if value hasn't changed from initial (unless we want to support re-saving same value, but usually not needed)
    // Actually, we should compare with the last saved value, but for now let's just save.
    // Optimization: check if valid number
    const qty = parseInt(quantity);
    if (isNaN(qty)) return;

    setIsPending(true);
    try {
      await updateCoffeeRequest(mealJobId, true, qty);
      toast({ title: "Coffee quantity saved" });
    } catch (error) {
      toast({ title: "Failed to save coffee quantity", variant: "destructive" });
    } finally {
      setIsPending(false);
    }
  };

  const handleCheckChange = async (newChecked: boolean) => {
    setChecked(newChecked);
    setIsPending(true);
    try {
      const qty = parseInt(quantity);
      await updateCoffeeRequest(
        mealJobId, 
        newChecked, 
        newChecked ? (isNaN(qty) ? 20 : qty) : null
      );
      toast({ title: "Coffee request updated" });
    } catch (error) {
      setChecked(!newChecked); // Revert on error
      toast({ title: "Failed to update coffee request", variant: "destructive" });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-md border border-input bg-transparent px-3 py-2 h-9">
      <Checkbox
        checked={checked}
        onCheckedChange={(c) => handleCheckChange(c as boolean)}
        disabled={disabled || isPending}
      />
      <span className="text-sm text-text-light">Required</span>
      {checked && (
        <Input
          type="number"
          className="ml-auto h-6 w-20 px-2 py-0 text-right text-xs"
          placeholder="Qty"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur(); // This will trigger onBlur which handles save
            }
          }}
          disabled={disabled}
        />
      )}
    </div>
  );
}
