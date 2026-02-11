"use client";
import { toast } from 'sonner';

import "@/app/fullcalendar.css"; // Component-level CSS import (~15KB, only loaded when calendar is used)

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import type { DateClickArg } from "@fullcalendar/interaction";
import type { EventClickArg, DatesSetArg } from "@fullcalendar/core";

import { formatDateLabel } from "@/lib/catering";
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
import { CheckCircle2, AlertCircle, Loader2, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MealServesDisplay,
  PercolatedCoffeeToggle,
  InlineMenuDisplay,
} from "@/components/catering";
import {
  assignCaterer,
  updateMealJobItems,
  updateCoffeeRequest,
  updateMealJobServes,
} from "@/app/(app)/(admin)/admin/bookings/[id]/actions";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  ssr: false,
});

interface CateringJobsCalendarProps {
  jobs: EnrichedMealJob[];
  caterers: { id: string; name: string }[];
  menuItems: {
    id: string;
    label: string;
    catererId: string | null;
    mealType: string | null;
  }[];
  readOnly?: boolean;
}

export function CateringJobsCalendar({
  jobs,
  caterers,
  menuItems,
  readOnly = false,
}: CateringJobsCalendarProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(
    jobs[0]?.date ?? new Date().toISOString().slice(0, 10)
  );
  const [loading, setLoading] = useState<string | null>(null);
  const [visibleRange, setVisibleRange] = useState<DatesSetArg | null>(null);

  const events = useMemo(
    () =>
      jobs.map((job) => ({
        id: job.id,
        title: job.assignedCaterer
          ? `${job.groupName} • ${job.timeSlot} (${job.assignedCaterer})`
          : `${job.groupName} • ${job.timeSlot}`,
        start: job.startISOString,
        end: job.endISOString,
        backgroundColor: job.assignedCatererColor ?? "#3788d8",
        borderColor: job.assignedCatererColor ?? "#3788d8",
      })),
    [jobs]
  );

  const jobsForSelectedDate = useMemo(
    () => jobs.filter((job) => job.date === selectedDate),
    [jobs, selectedDate]
  );

  // Group jobs by booking for the selected date
  const jobsByBooking = useMemo(() => {
    const byBooking = jobsForSelectedDate.reduce<
      Record<string, EnrichedMealJob[]>
    >((acc, job) => {
      if (!acc[job.bookingId]) acc[job.bookingId] = [];
      acc[job.bookingId].push(job);
      return acc;
    }, {});

    return Object.entries(byBooking).map(([bookingId, bookingJobs]) => ({
      bookingId,
      groupName: bookingJobs[0]?.groupName ?? "Unknown",
      jobs: bookingJobs.sort(
        (a, b) => a.startDate.getTime() - b.startDate.getTime()
      ),
    }));
  }, [jobsForSelectedDate]);

  // Calculate completion status for the selected date
  const completionStatus = useMemo(() => {
    let pendingCount = 0;

    for (const meal of jobsForSelectedDate) {
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
      isComplete: pendingCount === 0 && jobsForSelectedDate.length > 0,
      pendingCount,
      totalCount: jobsForSelectedDate.length,
    };
  }, [jobsForSelectedDate]);

  const handleDateClick = (info: DateClickArg) => {
    setSelectedDate(info.dateStr);
  };

  const handleEventClick = (info: EventClickArg) => {
    const eventDate = info.event.startStr.slice(0, 10);
    setSelectedDate(eventDate);
  };

  const handleDatesSet = (arg: DatesSetArg) => {
    setVisibleRange(arg);
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
    <div className="space-y-6">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        height="auto"
        headerToolbar={{ left: "prev,next today", center: "title", right: "" }}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        dayMaxEventRows={3}
        eventDisplay="block"
        datesSet={handleDatesSet}
      />

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
            <h3 className="text-lg font-semibold text-text">
              {formatDateLabel(selectedDate)}
            </h3>
            {jobsForSelectedDate.length > 0 && (
              <>
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
              </>
            )}
          </div>
          <span className="text-sm text-text-light">
            {jobsForSelectedDate.length}{" "}
            {jobsForSelectedDate.length === 1 ? "service" : "services"}
          </span>
        </div>

        {/* Separator */}
        {jobsForSelectedDate.length > 0 && (
          <div className="border-b border-border/50 mb-6" />
        )}

        {/* Bookings List */}
        {jobsByBooking.length > 0 ? (
          <div className="space-y-6">
            {jobsByBooking.map(({ bookingId, groupName, jobs: bookingJobs }) => (
              <div
                key={bookingId}
                className="space-y-4 rounded-2xl border border-border/70 bg-white/90 p-6 shadow-soft"
              >
                {/* Booking Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border/50">
                  <h4 className="font-semibold text-text">{groupName}</h4>
                  <span className="text-xs text-text-light">
                    {bookingJobs.length}{" "}
                    {bookingJobs.length === 1 ? "meal" : "meals"}
                  </span>
                </div>

                {/* Meals for this booking */}
                <div className="space-y-6">
                  {bookingJobs.map((meal, index) => {
                    const isCoffeeEligible =
                      meal.meal === "Morning Tea" || meal.meal === "Afternoon Tea";
                    const availableMenuItems = menuItems.filter(
                      (item) =>
                        (!item.catererId ||
                          item.catererId === meal.assignedCatererId) &&
                        (!item.mealType || item.mealType === meal.meal)
                    );
                    const selectedMenuLabel =
                      meal.menuIds.length > 0
                        ? menuItems.find((i) => i.id === meal.menuIds[0])?.label ??
                          null
                        : null;

                    return (
                      <div
                        key={meal.id}
                        className={cn(
                          "space-y-4",
                          index !== bookingJobs.length - 1 &&
                            "pb-6 border-b border-border/50"
                        )}
                      >
                        {/* Meal Header Row */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            {meal.assignedCatererColor && (
                              <div
                                className="h-3 w-3 rounded-full shrink-0"
                                style={{
                                  backgroundColor: meal.assignedCatererColor,
                                }}
                              />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-text">
                                  {meal.meal}
                                </span>
                                <span className="text-xs text-text-light">
                                  {meal.timeRangeLabel.split("•")[1]?.trim() ||
                                    meal.timeRangeLabel}
                                </span>
                              </div>
                              {meal.assignedCaterer && (
                                <Badge
                                  variant="outline"
                                  className="mt-1 border-border/70 bg-neutral text-text"
                                >
                                  {meal.assignedCaterer}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {/* Serves Count */}
                            <MealServesDisplay
                              count={meal.countsTotal}
                              editable={!readOnly}
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
                                  : meal.status === "Confirmed"
                                  ? "border-green-200 bg-green-50 text-green-700"
                                  : "border-border/70 bg-neutral text-text"
                              )}
                            >
                              {meal.status}
                            </Badge>
                          </div>
                        </div>

                        {/* Caterer and Menu Row */}
                        {!readOnly && (
                          <div className="grid gap-4 sm:grid-cols-2">
                            {/* Caterer Assignment */}
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
                                <SelectTrigger className="h-9 border-border/50 bg-white">
                                  <SelectValue placeholder="Select caterer" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="unassigned">
                                    Unassigned
                                  </SelectItem>
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
                                disabled={
                                  !meal.assignedCatererId || loading === meal.id
                                }
                              />
                            </div>
                          </div>
                        )}

                        {/* Read-only menu display */}
                        {readOnly && meal.menu.length > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <UtensilsCrossed className="h-4 w-4 text-olive-600" />
                            <span className="text-text-light">Menu:</span>
                            <span className="text-text">{meal.menu.join(", ")}</span>
                          </div>
                        )}

                        {/* Coffee Option */}
                        {isCoffeeEligible && !readOnly && (
                          <PercolatedCoffeeToggle
                            checked={meal.percolatedCoffee}
                            quantity={meal.percolatedCoffeeQuantity}
                            onToggle={(checked, qty) =>
                              handleCoffeeToggle(meal.id, checked, qty)
                            }
                            disabled={loading === meal.id}
                          />
                        )}

                        {/* Read-only coffee display */}
                        {isCoffeeEligible && readOnly && meal.percolatedCoffee && (
                          <div className="flex items-center gap-2 text-sm rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                            <span className="text-amber-700">
                              ☕ Percolated Coffee
                              {meal.percolatedCoffeeQuantity
                                ? ` (${meal.percolatedCoffeeQuantity} cups)`
                                : ""}
                            </span>
                          </div>
                        )}

                        {/* Dietary Counts */}
                        {Object.keys(meal.dietaryCounts).length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(meal.dietaryCounts).map(
                              ([diet, count]) => (
                                <div
                                  key={diet}
                                  className="flex items-center gap-2 rounded-lg bg-neutral px-3 py-1.5 text-xs border border-border/50"
                                >
                                  <span className="capitalize text-text-light">
                                    {diet}:
                                  </span>
                                  <span className="font-semibold text-text">
                                    {count}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-light">
            No catering services scheduled for this day.
          </p>
        )}
      </div>
    </div>
  );
}
