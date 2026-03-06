"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EnrichedMealJob } from "@/lib/catering";

export type KitchenDayData = {
  date: string;
  totalJobs: number;
  mealTypes: string[];
  unassignedCount: number;
  hasDietaryAlerts: boolean;
  hasChangeRequests: boolean;
  standaloneCount: number;
  allConfirmed: boolean;
};

function toLocalDate(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function getTodayString(): string {
  const d = new Date();
  return toLocalDate(d.getFullYear(), d.getMonth(), d.getDate());
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function buildDayData(jobs: EnrichedMealJob[]): Map<string, KitchenDayData> {
  const map = new Map<string, KitchenDayData>();
  for (const job of jobs) {
    const existing = map.get(job.date);
    const isUnassigned = !job.assignedCatererId;
    const isConfirmedOrDone = job.status === "Confirmed" || job.status === "Completed";
    if (!existing) {
      map.set(job.date, {
        date: job.date,
        totalJobs: 1,
        mealTypes: [job.meal],
        unassignedCount: isUnassigned ? 1 : 0,
        hasDietaryAlerts: Object.keys(job.dietaryCounts).length > 0,
        hasChangeRequests: job.changesRequested,
        standaloneCount: job.isLinkedToBooking ? 0 : 1,
        allConfirmed: isConfirmedOrDone,
      });
    } else {
      existing.totalJobs += 1;
      if (!existing.mealTypes.includes(job.meal)) existing.mealTypes.push(job.meal);
      if (isUnassigned) existing.unassignedCount += 1;
      if (Object.keys(job.dietaryCounts).length > 0) existing.hasDietaryAlerts = true;
      if (job.changesRequested) existing.hasChangeRequests = true;
      if (!job.isLinkedToBooking) existing.standaloneCount += 1;
      if (!isConfirmedOrDone) existing.allConfirmed = false;
    }
  }
  return map;
}

interface KitchenCalendarProps {
  jobs: EnrichedMealJob[];
  selectedDate?: string | null;
  onSelectDate?: (date: string) => void;
  readOnly?: boolean;
  compact?: boolean;
}

export function KitchenCalendar({
  jobs,
  selectedDate,
  onSelectDate,
  readOnly = false,
  compact = false,
}: KitchenCalendarProps) {
  const today = getTodayString();
  const todayDate = new Date();
  const [year, setYear] = useState(todayDate.getFullYear());
  const [month, setMonth] = useState(todayDate.getMonth());

  const dayDataMap = useMemo(() => buildDayData(jobs), [jobs]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length < totalCells) cells.push(null);

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }

  return (
    <div className="w-full select-none">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {MONTH_NAMES[month]} {year}
        </h3>
        <div className="flex items-center gap-0.5">
          <button
            onClick={prevMonth}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={nextMonth}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className="py-1 text-center text-xs font-medium text-gray-400 uppercase tracking-wider"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className={compact ? "min-h-[52px]" : "min-h-[72px] md:min-h-[120px]"} />;
          }

          const dateStr = toLocalDate(year, month, day);
          const data = dayDataMap.get(dateStr);
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const hasJobs = (data?.totalJobs ?? 0) > 0;
          const hasAlert = (data?.unassignedCount ?? 0) > 0 || (data?.hasChangeRequests ?? false);

          // Dot color: clay for unassigned/alerts, ochre for pending, forest for all-confirmed
          const dotColor = hasAlert
            ? "bg-status-clay"
            : data && !data.allConfirmed
            ? "bg-status-ochre"
            : "bg-status-forest";

          return (
            <div key={dateStr} className="p-0.5">
              <button
                onClick={() => !readOnly && onSelectDate?.(dateStr)}
                disabled={readOnly}
                className={cn(
                  cn(
                  "relative w-full flex flex-col items-center justify-start rounded-xl pt-2 pb-1.5 transition-all duration-150",
                  compact ? "min-h-[50px]" : "min-h-[70px] md:min-h-[116px]"
                ),
                  !readOnly && !isSelected && "hover:bg-gray-100 cursor-pointer",
                  isSelected
                    ? "bg-primary shadow-sm"
                    : isToday
                    ? "bg-primary/10"
                    : "bg-transparent"
                )}
                aria-label={dateStr}
                aria-pressed={isSelected}
              >
                {/* Date number */}
                <span
                  className={cn(
                    "text-base md:text-lg font-medium leading-none tabular-nums",
                    isSelected
                      ? "text-white"
                      : isToday
                      ? "text-primary"
                      : "text-gray-900"
                  )}
                >
                  {day}
                </span>

                {/* Event dot — centered below number */}
                {hasJobs && (
                  <span
                    className={cn(
                      "mt-2 size-1.5 rounded-full",
                      isSelected ? "bg-white/50" : hasAlert ? "bg-status-clay" : dotColor
                    )}
                  />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
