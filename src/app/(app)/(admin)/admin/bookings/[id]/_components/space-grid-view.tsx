"use client";

import { useTransition } from "react";
import { AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleReservationDays } from "../actions";
import type { BookingWithMeta, Space, SpaceReservation } from "@/lib/queries/bookings";
import type { Views } from "@/lib/database.types";

interface SpaceGridViewProps {
  booking: BookingWithMeta;
  spaces: Space[];
  reservations: SpaceReservation[];
  conflicts: Views<"v_space_conflicts">[];
  onAddSpace: () => void;
}

function generateDates(arrival: string, departure: string): string[] {
  const dates: string[] = [];
  const [ay, am, ad] = arrival.split("-").map(Number);
  const [dy, dm, dd] = departure.split("-").map(Number);
  const end = new Date(dy!, dm! - 1, dd!);
  for (const d = new Date(ay!, am! - 1, ad!); d <= end; d.setDate(d.getDate() + 1)) {
    const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
    dates.push(`${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  }
  return dates;
}

function formatColHeader(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y!, m! - 1, d!);
  return date.toLocaleDateString("en-AU", { weekday: "short", day: "numeric" });
}

export function SpaceGridView({
  booking,
  spaces,
  reservations,
  conflicts,
  onAddSpace,
}: SpaceGridViewProps) {
  const [isPending, startTransition] = useTransition();

  const allDates = generateDates(booking.arrival_date, booking.departure_date);

  // Build reservations map: spaceId → Set<date>
  const reservationMap = new Map<string, Set<string>>();
  for (const res of reservations) {
    if (!reservationMap.has(res.space_id)) {
      reservationMap.set(res.space_id, new Set());
    }
    reservationMap.get(res.space_id)!.add(res.service_date);
  }

  // Build conflict map: spaceId → Set<date>
  const conflictMap = new Map<string, Set<string>>();
  for (const c of conflicts) {
    if (!c.space_id || !c.service_date) continue;
    if (!conflictMap.has(c.space_id)) {
      conflictMap.set(c.space_id, new Set());
    }
    conflictMap.get(c.space_id)!.add(c.service_date);
  }

  const reservedSpaces = spaces.filter((s) => reservationMap.has(s.id));
  const totalConflicts = conflicts.length;

  const handleToggle = (spaceId: string, date: string, isAdding: boolean) => {
    startTransition(async () => {
      await toggleReservationDays(
        booking.id,
        spaceId,
        isAdding ? [date] : [],
        isAdding ? [] : [date]
      );
    });
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full min-w-max text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="sticky left-0 z-10 bg-gray-50 px-4 py-2.5 text-left text-xs font-semibold text-gray-500 min-w-[140px]">
                SPACE
              </th>
              {allDates.map((date) => (
                <th
                  key={date}
                  className="px-2 py-2.5 text-center text-xs font-medium text-gray-500 min-w-[52px]"
                >
                  {formatColHeader(date)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reservedSpaces.map((space) => {
              const reserved = reservationMap.get(space.id) ?? new Set<string>();
              const conflictDates = conflictMap.get(space.id) ?? new Set<string>();

              return (
                <tr key={space.id} className="hover:bg-gray-50/50">
                  <td className="sticky left-0 z-10 bg-white group-hover:bg-gray-50/50 px-4 py-2.5 font-medium text-gray-900 border-r border-gray-100">
                    <div className="flex items-center gap-2">
                      <span>{space.name}</span>
                      {conflictDates.size > 0 && (
                        <AlertTriangle className="size-3.5 text-[var(--status-clay)] flex-shrink-0" />
                      )}
                    </div>
                  </td>
                  {allDates.map((date) => {
                    const isReserved = reserved.has(date);
                    const hasConflict = conflictDates.has(date);
                    return (
                      <td key={date} className="px-2 py-2 text-center">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleToggle(space.id, date, !isReserved)}
                          className={cn(
                            "mx-auto flex items-center justify-center rounded-md border transition-all text-xs font-bold",
                            "w-8 h-8 disabled:opacity-50 disabled:cursor-not-allowed",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                            isReserved && hasConflict
                              ? "bg-[color-mix(in_srgb,var(--status-clay)_10%,transparent)] border-[color-mix(in_srgb,var(--status-clay)_30%,transparent)] text-[var(--status-clay)]"
                              : isReserved
                              ? "bg-primary/10 border-primary/30 text-primary"
                              : "bg-gray-50 border-gray-200 text-gray-300 hover:border-gray-300 hover:bg-gray-100"
                          )}
                          title={`${date} — ${isReserved ? "Click to remove" : "Click to add"}${hasConflict ? " (Conflict)" : ""}`}
                        >
                          {isReserved ? "■" : "□"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalConflicts > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-[color-mix(in_srgb,var(--status-clay)_20%,transparent)] bg-[color-mix(in_srgb,var(--status-clay)_5%,transparent)] px-4 py-2.5 text-sm">
          <AlertTriangle className="size-4 text-[var(--status-clay)] flex-shrink-0" />
          <span className="text-[var(--status-clay)] font-medium">
            {totalConflicts} conflict{totalConflicts !== 1 ? "s" : ""} detected — switch to card view for per-space resolution
          </span>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-dashed"
          onClick={onAddSpace}
          disabled={isPending}
        >
          <Plus className="size-3.5" />
          Add Space
        </Button>
      </div>
    </div>
  );
}
