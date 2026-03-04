"use client";

import { cn } from "@/lib/utils";

function getDayLetter(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y!, m! - 1, d!);
  return ["S", "M", "T", "W", "T", "F", "S"][date.getDay()] ?? "";
}

function getDateNum(dateStr: string): string {
  return String(parseInt(dateStr.split("-")[2] ?? "0"));
}

interface SpaceDayGridProps {
  dates: string[];
  reservedDates: Set<string>;
  conflictDates?: Set<string>;
  isPending?: boolean;
  onToggle?: (date: string, isAdding: boolean) => void;
}

export function SpaceDayGrid({
  dates,
  reservedDates,
  conflictDates,
  isPending,
  onToggle,
}: SpaceDayGridProps) {
  return (
    <div className="flex flex-wrap gap-1.5 md:gap-2">
      {dates.map((date) => {
        const isReserved = reservedDates.has(date);
        const hasConflict = conflictDates?.has(date) ?? false;

        return (
          <button
            key={date}
            type="button"
            disabled={isPending}
            onClick={() => onToggle?.(date, !isReserved)}
            className={cn(
              "flex flex-col items-center justify-center rounded-lg border text-xs font-medium transition-all select-none",
              "w-9 h-9 sm:w-10 sm:h-10",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
              isReserved && hasConflict
                ? "bg-status-clay border-status-clay text-white hover:opacity-90"
                : isReserved
                ? "bg-primary border-primary text-white hover:opacity-90"
                : "bg-gray-100 border-gray-200 text-gray-400 hover:border-primary hover:bg-primary/10 hover:text-primary"
            )}
            title={`${date} — ${isReserved ? "Click to remove" : "Click to add"}${hasConflict ? " (Conflict)" : ""}`}
          >
            <span className="text-[10px] leading-none opacity-80">
              {getDayLetter(date)}
            </span>
            <span className="leading-none text-xs">
              {getDateNum(date)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
