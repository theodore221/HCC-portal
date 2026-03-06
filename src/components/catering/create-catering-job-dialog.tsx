"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MealTypeIcon } from "./meal-type-icon";
import { MEAL_ORDER, MEAL_COLORS } from "@/lib/catering";
import { AlertTriangle, Leaf, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { createCateringJob } from "@/app/(app)/(admin)/admin/catering/jobs/actions";

type DietaryLabel = {
  id: string;
  label: string;
  is_allergy: boolean;
};

interface CreateCateringJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: string;
  caterers: { id: string; name: string }[];
  dietaryLabels: DietaryLabel[];
}

export function CreateCateringJobDialog({
  open,
  onOpenChange,
  defaultDate,
  caterers,
  dietaryLabels,
}: CreateCateringJobDialogProps) {
  const [isPending, startTransition] = useTransition();

  const today = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

  const [serviceDate, setServiceDate] = useState(defaultDate ?? today);
  const [selectedMeals, setSelectedMeals] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [headcount, setHeadcount] = useState<number>(10);
  const [assignedCatererId, setAssignedCatererId] = useState<string>("");
  const [dietaryCounts, setDietaryCounts] = useState<Record<string, number>>({});
  const [showAssignment, setShowAssignment] = useState(false);
  const [showDietary, setShowDietary] = useState(false);

  // Sync date with the selected calendar day each time the dialog opens
  useEffect(() => {
    if (open) {
      setServiceDate(defaultDate ?? today);
    }
  }, [open, defaultDate]);

  const toggleMeal = (meal: string) => {
    setSelectedMeals((prev) =>
      prev.includes(meal) ? prev.filter((m) => m !== meal) : [...prev, meal]
    );
  };

  const setDietaryCount = (label: string, count: number) => {
    setDietaryCounts((prev) => {
      if (count <= 0) {
        const next = { ...prev };
        delete next[label];
        return next;
      }
      return { ...prev, [label]: count };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedMeals.length === 0) return;

    startTransition(async () => {
      try {
        for (const meal of selectedMeals) {
          await createCateringJob({
            service_date: serviceDate,
            meal,
            group_name: groupName.trim(),
            counts_total: headcount,
            assigned_caterer_id: assignedCatererId || null,
            counts_by_diet: dietaryCounts,
          });
        }
        toast.success(
          selectedMeals.length === 1
            ? "Catering job created"
            : `${selectedMeals.length} catering jobs created`
        );
        onOpenChange(false);
        // Reset
        setSelectedMeals([]);
        setGroupName("");
        setHeadcount(10);
        setAssignedCatererId("");
        setDietaryCounts({});
      } catch (err: any) {
        toast.error(err?.message ?? "Failed to create catering job");
      }
    });
  };

  const submitLabel =
    selectedMeals.length <= 1
      ? "Create Job"
      : `Create ${selectedMeals.length} Jobs`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create Catering Job</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Job date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="service_date">Job Date</Label>
              <Input
                id="service_date"
                type="date"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="headcount">Headcount</Label>
              <Input
                id="headcount"
                type="number"
                min={1}
                value={headcount}
                onChange={(e) => setHeadcount(Number(e.target.value))}
                required
              />
            </div>
          </div>

          {/* Group name */}
          <div className="space-y-1.5">
            <Label htmlFor="group_name">
              Group Name <span className="text-danger">*</span>
            </Label>
            <Input
              id="group_name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Youth Retreat, Staff Training"
              required
            />
          </div>

          {/* Meal type selector — colored pill toggles */}
          <div className="space-y-1.5">
            <Label>
              Meal Types <span className="text-danger">*</span>{" "}
              <span className="text-xs text-gray-400 font-normal">(select one or more)</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {MEAL_ORDER.map((meal) => {
                const isActive = selectedMeals.includes(meal);
                const color = MEAL_COLORS[meal];
                return (
                  <button
                    key={meal}
                    type="button"
                    onClick={() => toggleMeal(meal)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                      isActive ? "text-white shadow-sm" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                    )}
                    style={
                      isActive
                        ? { backgroundColor: color?.hex, borderColor: color?.hex }
                        : undefined
                    }
                  >
                    <MealTypeIcon meal={meal} size={13} />
                    {meal}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Collapsible: Assignment */}
          <div className="rounded-xl border border-gray-200">
            <button
              type="button"
              onClick={() => setShowAssignment(!showAssignment)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <span>Assignment &amp; Caterer</span>
              {showAssignment ? (
                <ChevronUp className="size-4 text-gray-400" />
              ) : (
                <ChevronDown className="size-4 text-gray-400" />
              )}
            </button>
            {showAssignment && (
              <div className="px-4 pb-4 space-y-3 border-t border-gray-200 pt-3">
                <div className="space-y-1.5">
                  <Label>Assigned Caterer</Label>
                  <Select
                    value={assignedCatererId || "none"}
                    onValueChange={(v) => setAssignedCatererId(v === "none" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {caterers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Collapsible: Dietary */}
          {dietaryLabels.length > 0 && (
            <div className="rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() => setShowDietary(!showDietary)}
                className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <span>
                  Dietary Requirements
                  {Object.keys(dietaryCounts).length > 0 && (
                    <span className="ml-2 text-xs text-primary font-semibold">
                      ({Object.keys(dietaryCounts).length} set)
                    </span>
                  )}
                </span>
                {showDietary ? (
                  <ChevronUp className="size-4 text-gray-400" />
                ) : (
                  <ChevronDown className="size-4 text-gray-400" />
                )}
              </button>
              {showDietary && (
                <div className="px-4 pb-4 border-t border-gray-200 pt-3">
                  <div className="grid grid-cols-2 gap-2">
                    {dietaryLabels.map((dl) => {
                      const count = dietaryCounts[dl.label] ?? 0;
                      const isActive = count > 0;
                      return (
                        <div
                          key={dl.id}
                          className={cn(
                            "flex items-center justify-between rounded-xl border px-3 py-2.5 transition-colors",
                            isActive && dl.is_allergy
                              ? "border-status-clay/30 bg-status-clay/5"
                              : isActive
                              ? "border-primary/30 bg-primary/5"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          )}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            {dl.is_allergy ? (
                              <AlertTriangle className="size-3 text-status-clay shrink-0" />
                            ) : (
                              <Leaf className="size-3 text-primary shrink-0" />
                            )}
                            <span className="text-xs font-medium text-gray-700 truncate">
                              {dl.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            {isActive && (
                              <button
                                type="button"
                                onClick={() => setDietaryCount(dl.label, count - 1)}
                                className="size-5 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 text-sm font-bold"
                              >
                                −
                              </button>
                            )}
                            <span className="tabular-nums text-xs font-semibold text-gray-900 w-5 text-center">
                              {count}
                            </span>
                            <button
                              type="button"
                              onClick={() => setDietaryCount(dl.label, count + 1)}
                              className="size-5 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 text-sm font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || selectedMeals.length === 0 || !groupName.trim()}
            >
              {isPending ? "Creating..." : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
