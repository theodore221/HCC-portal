"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { MEAL_COLORS } from "@/lib/catering";
import {
  AlertTriangle,
  Leaf,
  ChevronDown,
  ChevronUp,
  Trash2,
  Coffee,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { EnrichedMealJob } from "@/lib/catering";
import {
  editCateringJob,
  updateJobMenuItems,
  updateJobCoffee,
  deleteCateringJob,
} from "@/app/(app)/(admin)/admin/catering/jobs/actions";

type DietaryLabel = { id: string; label: string; is_allergy: boolean };

interface EditCateringJobDialogProps {
  job: EnrichedMealJob;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caterers?: { id: string; name: string }[];
  menuItems?: {
    id: string;
    label: string;
    catererId: string | null;
    mealType: string | null;
  }[];
  dietaryLabels?: DietaryLabel[];
}

export function EditCateringJobDialog({
  job,
  open,
  onOpenChange,
  caterers = [],
  menuItems = [],
  dietaryLabels = [],
}: EditCateringJobDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [groupName, setGroupName] = useState(job.groupName);
  const [headcount, setHeadcount] = useState(job.countsTotal);
  const [serviceTime, setServiceTime] = useState(job.requestedServiceTime ?? "");
  const [catererId, setCatererId] = useState(job.assignedCatererId ?? "");
  const [menuId, setMenuId] = useState(job.menuIds[0] ?? "");
  const [coffeeEnabled, setCoffeeEnabled] = useState(job.percolatedCoffee);
  const [coffeeQty, setCoffeeQty] = useState<number>(job.percolatedCoffeeQuantity ?? 0);
  const [dietaryCounts, setDietaryCounts] = useState<Record<string, number>>(
    job.dietaryCounts ?? {}
  );
  const [showDietary, setShowDietary] = useState(false);

  // Sync form state each time the dialog opens
  useEffect(() => {
    if (open) {
      setGroupName(job.groupName);
      setHeadcount(job.countsTotal);
      setServiceTime(job.requestedServiceTime ?? "");
      setCatererId(job.assignedCatererId ?? "");
      setMenuId(job.menuIds[0] ?? "");
      setCoffeeEnabled(job.percolatedCoffee);
      setCoffeeQty(job.percolatedCoffeeQuantity ?? 0);
      setDietaryCounts(job.dietaryCounts ?? {});
      setShowDietary(false);
    }
  }, [open, job]);

  const isCoffeeEligible = job.meal === "Morning Tea" || job.meal === "Afternoon Tea";

  const availableMenuItems = menuItems.filter(
    (item) =>
      (!item.catererId || item.catererId === catererId) &&
      (!item.mealType || item.mealType === job.meal)
  );

  const handleCatererChange = (value: string) => {
    const newCatererId = value === "unassigned" ? "" : value;
    setCatererId(newCatererId);
    // Clear menu if it belonged to the old caterer
    const currentMenuItem = menuItems.find((m) => m.id === menuId);
    if (
      currentMenuItem?.catererId &&
      currentMenuItem.catererId !== newCatererId
    ) {
      setMenuId("");
    }
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

  const dietaryCount = Object.values(dietaryCounts).reduce((s, n) => s + n, 0);
  const mealColor = MEAL_COLORS[job.meal]?.hex ?? "#6b7280";
  const dateDisplay = new Date(`${job.date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "long",
    day: "numeric",
  });

  const handleSave = () => {
    startTransition(async () => {
      try {
        // 1. Main job fields
        await editCateringJob(job.id, {
          counts_total: headcount,
          group_name: !job.isLinkedToBooking ? groupName || null : undefined,
          requested_service_time: serviceTime || null,
          assigned_caterer_id: catererId || null,
          counts_by_diet: dietaryCounts,
        });

        // 2. Menu items (only if changed)
        const origMenuId = job.menuIds[0] ?? "";
        if (menuId !== origMenuId) {
          await updateJobMenuItems(job.id, menuId ? [menuId] : []);
        }

        // 3. Coffee (only if eligible and changed)
        if (
          isCoffeeEligible &&
          (coffeeEnabled !== job.percolatedCoffee ||
            coffeeQty !== (job.percolatedCoffeeQuantity ?? 0))
        ) {
          await updateJobCoffee(job.id, coffeeEnabled, coffeeEnabled ? coffeeQty : null);
        }

        toast.success("Catering job updated");
        router.refresh();
        onOpenChange(false);
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : "Failed to update catering job"
        );
      }
    });
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteCateringJob(job.id);
      router.refresh();
      toast.success("Catering job deleted");
      setDeleteDialogOpen(false);
      onOpenChange(false);
    } catch {
      toast.error("Failed to delete job");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this job?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the {job.meal} catering job for{" "}
              {job.groupName}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Job"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Catering Job</DialogTitle>
            <div className="flex items-center gap-2 pt-1">
              <MealTypeIcon meal={job.meal} size={15} />
              <span className="text-sm font-medium" style={{ color: mealColor }}>
                {job.meal}
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-sm text-gray-500">{dateDisplay}</span>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Group name — standalone jobs only */}
            {!job.isLinkedToBooking && (
              <div className="space-y-1.5">
                <Label htmlFor="edit_group_name">Group Name</Label>
                <Input
                  id="edit_group_name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Youth Retreat"
                />
              </div>
            )}

            {/* Headcount + Service time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit_headcount">Headcount</Label>
                <Input
                  id="edit_headcount"
                  type="number"
                  min={1}
                  value={headcount}
                  onChange={(e) => setHeadcount(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit_service_time">Service Time</Label>
                <Input
                  id="edit_service_time"
                  type="time"
                  value={serviceTime}
                  onChange={(e) => setServiceTime(e.target.value)}
                />
              </div>
            </div>

            {/* Caterer */}
            <div className="space-y-1.5">
              <Label>Caterer</Label>
              <Select value={catererId || "unassigned"} onValueChange={handleCatererChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select caterer..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">
                    <span className="text-gray-400">Unassigned</span>
                  </SelectItem>
                  {caterers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Menu item */}
            <div className="space-y-1.5">
              <Label>Menu Item</Label>
              <Select
                value={menuId || "none"}
                onValueChange={(v) => setMenuId(v === "none" ? "" : v)}
                disabled={!catererId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={catererId ? "Select menu item..." : "Assign caterer first"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-gray-400">None</span>
                  </SelectItem>
                  {availableMenuItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Percolated coffee — Morning/Afternoon Tea only */}
            {isCoffeeEligible && (
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5">
                <input
                  type="checkbox"
                  id="edit_coffee"
                  checked={coffeeEnabled}
                  onChange={(e) => setCoffeeEnabled(e.target.checked)}
                  className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label
                  htmlFor="edit_coffee"
                  className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer flex-1"
                >
                  <Coffee className="size-4 text-status-ochre" />
                  Percolated Coffee
                </label>
                {coffeeEnabled && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      value={coffeeQty}
                      onChange={(e) => setCoffeeQty(Number(e.target.value))}
                      className="h-8 w-20 text-sm"
                      placeholder="Qty"
                    />
                    <span className="text-xs text-gray-500">cups</span>
                  </div>
                )}
              </div>
            )}

            {/* Dietary requirements — collapsible */}
            {dietaryLabels.length > 0 && (
              <div className="rounded-xl border border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowDietary(!showDietary)}
                  className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <span>
                    Dietary Requirements
                    {dietaryCount > 0 && (
                      <span className="ml-2 text-xs text-primary font-semibold">
                        ({dietaryCount} set)
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
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isPending}
            >
              <Trash2 className="size-4 mr-2" />
              Delete
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isPending}>
                {isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
