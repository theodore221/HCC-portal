"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type CalendarDayData = {
  date: string; // YYYY-MM-DD
  dotCount?: number; // 0-4 dots to show
  hasAlert?: boolean; // orange dot overlay
  allAccepted?: boolean; // all assigned staff have accepted
};

type CalendarGridProps = {
  year: number;
  month: number; // 0-indexed (0=Jan)
  dayData?: CalendarDayData[];
  selectedDate?: string | null;
  onSelectDate?: (date: string) => void;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  view?: "month" | "two-week";
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toLocalDate(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function getTodayString(): string {
  const d = new Date();
  return toLocalDate(d.getFullYear(), d.getMonth(), d.getDate());
}

export function CalendarGrid({
  year,
  month,
  dayData = [],
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  view = "month",
}: CalendarGridProps) {
  const today = getTodayString();
  const dataMap = new Map<string, CalendarDayData>();
  for (const d of dayData) {
    dataMap.set(d.date, d);
  }

  // Build grid of days
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // For two-week view: show current + next week relative to today
  let startCell = 0;
  let totalCells: number;
  if (view === "two-week") {
    totalCells = 14;
    // Start from beginning of week containing day 1
    startCell = firstDay;
  } else {
    totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  }

  // Build cell array: null = empty, number = day-of-month
  const cells: (number | null)[] = [];
  for (let i = 0; i < (view === "month" ? totalCells : firstDay); i++) {
    cells.push(null);
  }
  const dayCount = view === "two-week" ? Math.min(14, daysInMonth) : daysInMonth;
  for (let d = 1; d <= dayCount; d++) {
    cells.push(d);
  }
  while (view === "month" && cells.length % 7 !== 0) {
    cells.push(null);
  }

  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  return (
    <div className="w-full select-none">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">
          {MONTH_NAMES[month]} {year}
        </h3>
        <div className="flex gap-1">
          <button
            onClick={onPrevMonth}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={onNextMonth}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className="py-1 text-center text-xs font-medium text-gray-400 uppercase tracking-wide"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} />;
          }
          const dateStr = toLocalDate(year, month, day);
          const data = dataMap.get(dateStr);
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const dotCount = Math.min(data?.dotCount ?? 0, 4);
          const hasAlert = data?.hasAlert ?? false;
          const allAccepted = data?.allAccepted ?? false;

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate?.(dateStr)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl py-2.5 min-h-[64px] transition-all",
                isSelected
                  ? "bg-primary text-white"
                  : isToday
                  ? "bg-primary/10 text-primary font-semibold"
                  : "hover:bg-gray-100 text-gray-700"
              )}
              aria-label={dateStr}
              aria-pressed={isSelected}
            >
              <span className="text-sm font-medium leading-none">{day}</span>
              {/* Dot indicators */}
              {dotCount > 0 ? (
                <div className="flex gap-0.5">
                  {Array.from({ length: dotCount }).map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "size-1.5 rounded-full",
                        isSelected
                          ? "bg-white/70"
                          : allAccepted
                          ? "bg-status-forest"
                          : "bg-status-ochre"
                      )}
                    />
                  ))}
                </div>
              ) : (
                <div className="h-1" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
