"use client";

import { useState, useRef, useCallback, useTransition } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { saveWeeklyUnavailability } from "../../actions";
import type { WeeklyUnavailabilityRow, DayOfWeek } from "@/lib/queries/rostering.server";

// ============================================================
// Constants
// ============================================================

const DAYS: DayOfWeek[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// 2-hour blocks from 06:00 to 22:00
const TWO_HOUR_BLOCKS: { start: string; end: string; label: string }[] = [
  { start: "06:00", end: "08:00", label: "6–8 AM" },
  { start: "08:00", end: "10:00", label: "8–10 AM" },
  { start: "10:00", end: "12:00", label: "10–12 PM" },
  { start: "12:00", end: "14:00", label: "12–2 PM" },
  { start: "14:00", end: "16:00", label: "2–4 PM" },
  { start: "16:00", end: "18:00", label: "4–6 PM" },
  { start: "18:00", end: "20:00", label: "6–8 PM" },
  { start: "20:00", end: "22:00", label: "8–10 PM" },
];

// 1-hour blocks from 06:00 to 22:00
const ONE_HOUR_BLOCKS: { start: string; end: string; label: string }[] = Array.from(
  { length: 16 },
  (_, i) => {
    const hour = 6 + i;
    const nextHour = hour + 1;
    const start = `${String(hour).padStart(2, "0")}:00`;
    const end = `${String(nextHour).padStart(2, "0")}:00`;
    const labelHour = hour % 12 || 12;
    const labelNextHour = nextHour % 12 || 12;
    const amPm = hour < 12 ? "AM" : "PM";
    const nextAmPm = nextHour < 12 ? "AM" : nextHour === 12 ? "PM" : "PM";
    return { start, end, label: `${labelHour}–${labelNextHour} ${hour < 12 && nextHour >= 12 ? nextAmPm : amPm}` };
  }
);

// ============================================================
// State helpers
// ============================================================

// A cell key is "Mon|06:00|08:00" — pipe separator avoids conflict with colons in time strings
type CellKey = string;

function makeCellKey(day: DayOfWeek, start: string, end: string): CellKey {
  return `${day}|${start}|${end}`;
}

function dbRowsToCells(rows: WeeklyUnavailabilityRow[], blocks: typeof TWO_HOUR_BLOCKS): Set<CellKey> {
  const cells = new Set<CellKey>();
  for (const row of rows) {
    // Supabase returns time as "HH:MM:SS" — normalise to "HH:MM" for string comparison
    const rowStart = row.start_time.slice(0, 5);
    const rowEnd = row.end_time.slice(0, 5);
    for (const block of blocks) {
      if (block.start < rowEnd && block.end > rowStart) {
        cells.add(makeCellKey(row.day_of_week as DayOfWeek, block.start, block.end));
      }
    }
  }
  return cells;
}

function cellsToDbRows(cells: Set<CellKey>): { day_of_week: string; start_time: string; end_time: string }[] {
  // Group by day, then merge consecutive blocks into time spans
  const byDay: Record<string, { start: string; end: string }[]> = {};

  for (const key of cells) {
    const [day, start, end] = key.split("|");
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push({ start, end });
  }

  const result: { day_of_week: string; start_time: string; end_time: string }[] = [];

  for (const [day, blockList] of Object.entries(byDay)) {
    const sorted = blockList.sort((a, b) => a.start.localeCompare(b.start));
    const merged: { start: string; end: string }[] = [];

    for (const block of sorted) {
      if (merged.length > 0 && merged[merged.length - 1].end === block.start) {
        merged[merged.length - 1].end = block.end;
      } else {
        merged.push({ start: block.start, end: block.end });
      }
    }

    for (const span of merged) {
      result.push({ day_of_week: day, start_time: span.start, end_time: span.end });
    }
  }

  return result;
}

// ============================================================
// Mobile day accordion item
// ============================================================

function MobileDayRow({
  day,
  blocks,
  cells,
  onToggleCell,
}: {
  day: DayOfWeek;
  blocks: typeof TWO_HOUR_BLOCKS;
  cells: Set<CellKey>;
  onToggleCell: (key: CellKey) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const blockedCount = blocks.filter((b) => cells.has(makeCellKey(day, b.start, b.end))).length;
  const totalHours = blockedCount * (blocks === TWO_HOUR_BLOCKS ? 2 : 1);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <span className="text-sm font-medium text-gray-700">{day}</span>
        <div className="flex items-center gap-2">
          {totalHours > 0 && (
            <span className="text-xs text-gray-400">{totalHours} hr{totalHours !== 1 ? "s" : ""} blocked</span>
          )}
          {expanded ? <ChevronDown className="size-4 text-gray-400" /> : <ChevronRight className="size-4 text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 divide-y divide-gray-100">
          {blocks.map((block) => {
            const key = makeCellKey(day, block.start, block.end);
            const isUnavailable = cells.has(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => onToggleCell(key)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left",
                  isUnavailable
                    ? "bg-status-clay/10 text-gray-700"
                    : "bg-white text-gray-500 hover:bg-gray-50"
                )}
              >
                <span className={cn(
                  "size-2.5 rounded-sm flex-shrink-0",
                  isUnavailable ? "bg-status-clay" : "border border-gray-300"
                )} />
                <span className="text-sm">{block.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Main component
// ============================================================

type Props = { initialRows: WeeklyUnavailabilityRow[] };

export function WeeklyPlanner({ initialRows }: Props) {
  const [hourly, setHourly] = useState(false);
  const blocks = hourly ? ONE_HOUR_BLOCKS : TWO_HOUR_BLOCKS;

  const [cells, setCells] = useState<Set<CellKey>>(
    () => dbRowsToCells(initialRows, TWO_HOUR_BLOCKS)
  );

  const [pending, startTransition] = useTransition();

  // Drag state
  const dragStartRef = useRef<{ key: CellKey; targetState: boolean } | null>(null);

  const toggleCell = useCallback((key: CellKey) => {
    setCells((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  function handleMouseDown(key: CellKey) {
    const targetState = !cells.has(key);
    dragStartRef.current = { key, targetState };
    setCells((prev) => {
      const next = new Set(prev);
      if (targetState) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  function handleMouseEnter(key: CellKey) {
    if (!dragStartRef.current) return;
    const { targetState } = dragStartRef.current;
    setCells((prev) => {
      const next = new Set(prev);
      if (targetState) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  function handleMouseUp() {
    dragStartRef.current = null;
  }

  function toggleColumn(day: DayOfWeek) {
    const allSelected = blocks.every((b) => cells.has(makeCellKey(day, b.start, b.end)));
    setCells((prev) => {
      const next = new Set(prev);
      for (const b of blocks) {
        const key = makeCellKey(day, b.start, b.end);
        if (allSelected) next.delete(key);
        else next.add(key);
      }
      return next;
    });
  }

  function toggleRow(blockStart: string, blockEnd: string) {
    const allSelected = DAYS.every((day) => cells.has(makeCellKey(day, blockStart, blockEnd)));
    setCells((prev) => {
      const next = new Set(prev);
      for (const day of DAYS) {
        const key = makeCellKey(day, blockStart, blockEnd);
        if (allSelected) next.delete(key);
        else next.add(key);
      }
      return next;
    });
  }

  function handleClearAll() {
    setCells(new Set());
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await saveWeeklyUnavailability(cellsToDbRows(cells));
        toast.success("Weekly schedule saved");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save schedule");
      }
    });
  }

  // When switching hourly/2h, re-derive cells from current DB-equivalent rows
  function handleToggleHourly() {
    // Convert current cells → db rows → re-derive for new block size
    const dbRows = cellsToDbRows(cells).map((r) => ({
      id: "",
      staff_profile_id: "",
      day_of_week: r.day_of_week as DayOfWeek,
      start_time: r.start_time,
      end_time: r.end_time,
    }));
    const newBlocks = !hourly ? ONE_HOUR_BLOCKS : TWO_HOUR_BLOCKS;
    setCells(dbRowsToCells(dbRows, newBlocks));
    setHourly((h) => !h);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-base">Weekly schedule</CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">
              Mark times when you&apos;re regularly unavailable each week.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="inline-block size-3 rounded-sm bg-white border border-gray-200" />
            Available
            <span className="inline-block size-3 rounded-sm bg-status-clay/20 border border-status-clay/30 ml-2" />
            Unavailable
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Desktop grid — hidden below 640px */}
        <div
          className="hidden sm:block overflow-x-auto select-none"
          onMouseLeave={handleMouseUp}
          onMouseUp={handleMouseUp}
        >
          <table className="w-full border-collapse table-fixed">
            <colgroup>
              <col className="w-20" />
              {DAYS.map((d) => <col key={d} />)}
            </colgroup>
            <thead>
              <tr>
                <th className="py-1" />
                {DAYS.map((day) => (
                  <th key={day} className="py-1 text-center">
                    <button
                      type="button"
                      onClick={() => toggleColumn(day)}
                      className="text-xs font-medium text-gray-400 uppercase tracking-wide hover:text-gray-700 hover:bg-gray-50 rounded px-2 py-1 transition-colors w-full"
                    >
                      {day}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {blocks.map((block) => (
                <tr key={block.start}>
                  <td className="pr-2 text-right">
                    <button
                      type="button"
                      onClick={() => toggleRow(block.start, block.end)}
                      className="text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded px-1 py-0.5 transition-colors whitespace-nowrap"
                    >
                      {block.label}
                    </button>
                  </td>
                  {DAYS.map((day) => {
                    const key = makeCellKey(day, block.start, block.end);
                    const isUnavailable = cells.has(key);
                    return (
                      <td key={day} className="p-0.5">
                        <div
                          role="checkbox"
                          aria-checked={isUnavailable}
                          aria-label={`${day} ${block.label}`}
                          tabIndex={0}
                          className={cn(
                            "min-h-[44px] w-full rounded border cursor-pointer transition-colors",
                            isUnavailable
                              ? "bg-status-clay/15 border-status-clay/30 hover:bg-status-clay/20"
                              : "bg-white border-gray-200 hover:bg-gray-50"
                          )}
                          onMouseDown={() => handleMouseDown(key)}
                          onMouseEnter={() => handleMouseEnter(key)}
                          onKeyDown={(e) => {
                            if (e.key === " " || e.key === "Enter") {
                              e.preventDefault();
                              toggleCell(key);
                            }
                          }}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile accordion — shown below 640px */}
        <div className="sm:hidden space-y-2">
          {DAYS.map((day) => (
            <MobileDayRow
              key={day}
              day={day}
              blocks={blocks}
              cells={cells}
              onToggleCell={toggleCell}
            />
          ))}
        </div>

        {/* Actions row */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Clear all
          </button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleToggleHourly}
              className="text-xs"
            >
              {hourly ? "2-hour blocks" : "Show hourly"}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={pending}
            >
              {pending ? "Saving…" : "Save schedule"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
