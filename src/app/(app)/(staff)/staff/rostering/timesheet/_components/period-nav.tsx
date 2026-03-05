"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatPeriodLabel(start: string, end: string): string {
  const s = new Date(`${start}T00:00:00`);
  const e = new Date(`${end}T00:00:00`);
  const sLabel = s.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
  const eLabel = e.toLocaleDateString("en-AU", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
  return `${sLabel} – ${eLabel}`;
}

type Props = {
  periodStart: string;
  periodEnd: string;
  currentPeriodStart: string;
};

export function PeriodNav({ periodStart, periodEnd, currentPeriodStart }: Props) {
  const router = useRouter();
  const isCurrentPeriod = periodStart === currentPeriodStart;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        className="size-8"
        onClick={() => router.push(`?start=${addDays(periodStart, -14)}`)}
        aria-label="Previous fortnight"
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="text-sm font-medium text-gray-900 min-w-[220px] text-center tabular-nums">
        {formatPeriodLabel(periodStart, periodEnd)}
      </span>
      <Button
        variant="outline"
        size="icon"
        className="size-8"
        onClick={() => router.push(`?start=${addDays(periodStart, 14)}`)}
        aria-label="Next fortnight"
      >
        <ChevronRight className="size-4" />
      </Button>
      {!isCurrentPeriod && (
        <Button
          variant="outline"
          size="sm"
          className="ml-1 text-xs"
          onClick={() => router.push(`?start=${currentPeriodStart}`)}
        >
          Current period
        </Button>
      )}
    </div>
  );
}
