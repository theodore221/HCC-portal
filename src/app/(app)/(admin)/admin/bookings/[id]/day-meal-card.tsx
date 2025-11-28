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
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  assignCaterer,
  assignCatererToDay,
  updateMealJobItems,
  updateCoffeeRequest,
} from "./actions";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle2, AlertCircle, Loader2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const { toast } = useToast();
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
      toast({
        title: `Assigned caterer to ${unassignedCount} meal${
          unassignedCount !== 1 ? "s" : ""
        }`,
      });
      setBulkCatererId("");
    } catch (error) {
      toast({ title: "Failed to assign caterer", variant: "destructive" });
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
    <div
      className={`rounded-2xl border p-6 shadow-soft transition-colors ${
        completionStatus.isComplete
          ? "border-green-200 bg-green-50/30"
          : "border-border/70 bg-white/90"
      }`}
    >
      {/* Date Header with Completion Status */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-text">{formattedDate}</h3>
          <div className="flex items-center gap-2">
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

        {/* Bulk Assignment Controls (shown when not in customize mode) */}
        {!customizeMode && (
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-2">
              <Select
                value={bulkCatererId}
                onValueChange={setBulkCatererId}
                disabled={bulkLoading}
              >
                <SelectTrigger className="h-9 w-[200px] bg-white">
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
                Assign
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={customizeMode}
                onCheckedChange={setCustomizeMode}
                id={`customize-${date}`}
              />
              <label
                htmlFor={`customize-${date}`}
                className="text-xs font-medium text-text cursor-pointer"
              >
                Assign Individual Meals
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Customize Mode Header */}
      {customizeMode && (
        <div className="mb-4 rounded-lg border border-green-100 bg-green-50/50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-green-900">
              Individual meal customization enabled
            </span>
            <div className="flex items-center gap-2">
              <Switch
                checked={customizeMode}
                onCheckedChange={setCustomizeMode}
                id={`customize-${date}-active`}
              />
              <label
                htmlFor={`customize-${date}-active`}
                className="text-xs font-medium text-green-900 cursor-pointer"
              >
                Disable
              </label>
            </div>
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
                    {meal.meal}
                  </span>
                  <span className="text-xs text-text-light">
                    {meal.timeRangeLabel.split("•")[1]?.trim()}
                  </span>
                  {!customizeMode && meal.assignedCatererId && (
                    <Badge
                      variant="outline"
                      className="ml-2 border-olive-200 bg-olive-50 text-olive-700"
                    >
                      {
                        caterers.find((c) => c.id === meal.assignedCatererId)
                          ?.name
                      }
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

              <div className="space-y-3">
                {/* Caterer and Menu in single row */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Caterer Assignment (only shown in customize mode) */}
                  {customizeMode && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-light">
                        Assigned Caterer
                      </label>
                      <Select
                        value={meal.assignedCatererId ?? "unassigned"}
                        onValueChange={(val) =>
                          handleCatererChange(meal.id, val)
                        }
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
                  )}

                  {/* Menu Items */}
                  <div
                    className={`space-y-1.5 ${
                      !customizeMode ? "sm:col-span-2" : ""
                    }`}
                  >
                    <label className="text-xs font-medium text-text-light">
                      Menu Selection
                    </label>
                    <EditableMenuSelect
                      mealJobId={meal.id}
                      currentMenuIds={meal.menuIds ?? []}
                      availableItems={availableMenuItems}
                      disabled={!meal.assignedCatererId || loading === meal.id}
                      onUpdate={(items) => handleMenuChange(meal.id, items)}
                      placeholder={
                        meal.assignedCatererId
                          ? "Select item..."
                          : "Assign caterer first"
                      }
                    />
                  </div>
                </div>

                {/* Coffee Option - Separate Row for Morning/Afternoon Tea */}
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

function EditableMenuSelect({
  mealJobId,
  currentMenuIds,
  availableItems,
  disabled,
  onUpdate,
  placeholder,
}: {
  mealJobId: string;
  currentMenuIds: string[];
  availableItems: { id: string; label: string }[];
  disabled: boolean;
  onUpdate: (items: string[]) => void;
  placeholder: string;
}) {
  const [isEditing, setIsEditing] = useState(false);

  const selectedLabel =
    currentMenuIds.length > 0
      ? availableItems.find((i) => i.id === currentMenuIds[0])?.label
      : null;

  if (isEditing) {
    return (
      <Select
        value={currentMenuIds[0] ?? "none"}
        onValueChange={(val) => {
          onUpdate(val === "none" ? [] : [val]);
          setIsEditing(false);
        }}
        disabled={disabled}
        defaultOpen={true}
        onOpenChange={(open) => {
          if (!open) setIsEditing(false);
        }}
      >
        <SelectTrigger className="h-9">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          {availableItems.length > 0 ? (
            availableItems.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.label}
              </SelectItem>
            ))
          ) : (
            <div className="py-2 px-2 text-sm text-muted-foreground text-center">
              No items found
            </div>
          )}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div
      onClick={() => !disabled && setIsEditing(true)}
      className={cn(
        "flex h-9 w-full items-center rounded-md border border-transparent px-3 py-1 text-sm shadow-sm transition-colors hover:bg-muted/50 cursor-pointer",
        !selectedLabel && "text-muted-foreground italic",
        disabled && "cursor-not-allowed opacity-50 hover:bg-transparent"
      )}
    >
      {selectedLabel || (disabled ? placeholder : "-")}
      {!disabled && <Pencil className="ml-auto h-3 w-3 opacity-50" />}
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
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!checked) return;

    const qty = parseInt(quantity);
    if (isNaN(qty)) return;

    setIsPending(true);
    try {
      await updateCoffeeRequest(mealJobId, true, qty);
      toast({ title: "Coffee quantity saved" });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Failed to save coffee quantity",
        variant: "destructive",
      });
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
      if (!newChecked) setIsEditing(false);
    } catch (error) {
      setChecked(!newChecked);
      toast({
        title: "Failed to update coffee request",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-3 rounded-md border border-input bg-white px-3 py-2 h-9 animate-in fade-in zoom-in-95 duration-200">
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
                e.currentTarget.blur();
              }
            }}
            disabled={disabled}
            autoFocus
          />
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs ml-1"
          onClick={() => setIsEditing(false)}
        >
          Done
        </Button>
      </div>
    );
  }

  return (
    <div
      onClick={() => !disabled && setIsEditing(true)}
      className={cn(
        "flex h-9 w-full items-center rounded-md border border-transparent px-3 py-1 text-sm shadow-sm transition-colors hover:bg-muted/50 cursor-pointer",
        !checked && "text-muted-foreground",
        disabled && "cursor-not-allowed opacity-50 hover:bg-transparent"
      )}
    >
      {checked ? `Required (${quantity})` : "-"}
      {!disabled && <Pencil className="ml-auto h-3 w-3 opacity-50" />}
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
