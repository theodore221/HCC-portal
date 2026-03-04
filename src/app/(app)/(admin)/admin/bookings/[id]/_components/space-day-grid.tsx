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
              "w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
              isReserved && hasConflict
                ? "bg-[color-mix(in_srgb,var(--status-clay)_10%,transparent)] border-[color-mix(in_srgb,var(--status-clay)_30%,transparent)] text-[var(--status-clay)] hover:bg-[color-mix(in_srgb,var(--status-clay)_20%,transparent)]"
                : isReserved
                ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
                : "bg-gray-50 border-gray-200 text-gray-400 hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
            )}
            title={`${date} — ${isReserved ? "Click to remove" : "Click to add"}${hasConflict ? " (Conflict)" : ""}`}
          >
            <span className="text-[8px] leading-none opacity-60 hidden md:block">
              {getDayLetter(date)}
            </span>
            <span className="leading-none text-[11px] md:text-xs">
              {getDateNum(date)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
