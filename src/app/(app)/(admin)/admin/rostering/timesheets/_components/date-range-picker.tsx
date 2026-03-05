"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  mode: "fortnight" | "custom";
  periodStart: string;
  periodEnd: string;
  currentPeriodStart: string;
};

export function DateRangePicker({ mode, periodStart, periodEnd, currentPeriodStart }: Props) {
  const router = useRouter();
  const [customStart, setCustomStart] = useState(periodStart);
  const [customEnd, setCustomEnd] = useState(periodEnd);
  const isCurrentPeriod = periodStart === currentPeriodStart;

  function applyCustom() {
    if (customStart && customEnd && customStart <= customEnd) {
      router.push(`?mode=custom&start=${customStart}&end=${customEnd}`);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Mode toggle */}
      <div className="flex items-center rounded-full bg-gray-100 p-0.5">
        <button
          type="button"
          onClick={() => router.push(`?start=${isCurrentPeriod ? currentPeriodStart : periodStart}`)}
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            mode === "fortnight"
              ? "bg-white shadow-sm text-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Fortnight
        </button>
        <button
          type="button"
          onClick={() =>
            router.push(`?mode=custom&start=${periodStart}&end=${periodEnd}`)
          }
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            mode === "custom"
              ? "bg-white shadow-sm text-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Custom
        </button>
      </div>

      {mode === "fortnight" ? (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => router.push(`?start=${addDays(periodStart, -14)}`)}
            aria-label="Previous fortnight"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm font-medium text-gray-900 min-w-[240px] text-center tabular-nums">
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
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="w-36 h-8 text-sm"
            />
            <span className="text-gray-400 text-sm">to</span>
            <Input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="w-36 h-8 text-sm"
            />
          </div>
          <Button
            size="sm"
            onClick={applyCustom}
            disabled={!customStart || !customEnd || customStart > customEnd}
          >
            Apply
          </Button>
        </div>
      )}
    </div>
  );
}
