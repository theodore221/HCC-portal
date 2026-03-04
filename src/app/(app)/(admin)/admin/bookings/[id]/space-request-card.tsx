"use client";

import { useState } from "react";
import { AlertTriangle, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { SpaceDayGrid } from "./_components/space-day-grid";
import { SpaceTimePicker } from "./_components/space-time-picker";
import { ResolveConflictDialog } from "./_components/resolve-conflict-dialog";
import type { BookingWithMeta, Space, SpaceReservation } from "@/lib/queries/bookings";
import type { Views } from "@/lib/database.types";

interface ConflictingBooking {
  id: string;
  reference: string | null;
  status: string;
  contact_name: string | null;
  customer_name: string | null;
  headcount: number;
}

interface SpaceRequestCardProps {
  spaceId: string;
  reservations: SpaceReservation[];
  space: Space | undefined;
  allSpaces: Space[];
  booking: BookingWithMeta;
  conflicts: Views<"v_space_conflicts">[];
  conflictingBookings: ConflictingBooking[];
  isPending: boolean;
  onSpaceChange: (reservationId: string, newSpaceId: string) => void;
  onToggleDay: (date: string, isAdding: boolean) => void;
  onRemove: () => void;
  onUpdateTimes: (
    dates: string[],
    startTime: string | null,
    endTime: string | null
  ) => void;
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

function formatConflictDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y!, m! - 1, d!);
  return date.toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function SpaceRequestCard({
  spaceId,
  reservations,
  space,
  allSpaces,
  booking,
  conflicts,
  conflictingBookings,
  isPending,
  onSpaceChange,
  onToggleDay,
  onRemove,
  onUpdateTimes,
}: SpaceRequestCardProps) {
  const [resolveInfo, setResolveInfo] = useState<{
    conflictingBookingId: string;
    dates: string[];
  } | null>(null);

  const allDates = generateDates(booking.arrival_date, booking.departure_date);
  const reservedDates = new Set(reservations.map((r) => r.service_date));

  // Group conflicts by conflicting booking ID
  const conflictsByBooking = new Map<string, string[]>();
  for (const c of conflicts) {
    if (!c.conflicts_with || !c.service_date) continue;
    if (!conflictsByBooking.has(c.conflicts_with)) {
      conflictsByBooking.set(c.conflicts_with, []);
    }
    conflictsByBooking.get(c.conflicts_with)!.push(c.service_date);
  }

  const conflictDates = new Set(
    conflicts.map((c) => c.service_date).filter(Boolean) as string[]
  );
  const hasConflict = conflictsByBooking.size > 0;

  // Capacity
  const capacity = space?.capacity ?? 0;
  const isOverCapacity = capacity > 0 && booking.headcount > capacity;

  // Time display from first reservation
  const firstRes = reservations[0];
  const startTime = firstRes?.start_time ?? null;
  const endTime = firstRes?.end_time ?? null;

  // Find conflicting booking details for the resolve dialog
  const resolveConflict = resolveInfo
    ? conflictingBookings.find((cb) => cb.id === resolveInfo.conflictingBookingId)
    : null;

  return (
    <>
      <Card
        className={cn(
          "border rounded-2xl shadow-soft overflow-hidden",
          hasConflict
            ? "border-[color-mix(in_srgb,var(--status-clay)_20%,transparent)]"
            : isOverCapacity
            ? "border-amber-200"
            : "border-border/70 bg-white/90"
        )}
      >
        <CardContent className="p-5 space-y-4">
          {/* Header row */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <h3 className="font-bold text-gray-900 text-base truncate">
                {space?.name ?? "Unknown Space"}
              </h3>
              {hasConflict ? (
                <Badge className="bg-[color-mix(in_srgb,var(--status-clay)_10%,transparent)] text-[var(--status-clay)] border-[color-mix(in_srgb,var(--status-clay)_20%,transparent)] rounded-full px-2 text-xs flex-shrink-0">
                  Conflict
                </Badge>
              ) : isOverCapacity ? (
                <Badge className="bg-amber-50 text-amber-700 border-amber-200 rounded-full px-2 text-xs flex-shrink-0">
                  Over Capacity
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-gray-500 border-gray-200 bg-gray-50 rounded-full px-2 text-xs flex-shrink-0"
                >
                  Available
                </Badge>
              )}
              {capacity > 0 && (
                <span
                  className={cn(
                    "text-xs flex items-center gap-0.5 flex-shrink-0",
                    isOverCapacity ? "text-amber-600 font-medium" : "text-gray-400"
                  )}
                >
                  <Users className="size-3" />
                  {booking.headcount}/{capacity}
                </span>
              )}
            </div>

            {/* Space switcher */}
            <div className="w-[170px] flex-shrink-0">
              <Select
                disabled={isPending}
                value={spaceId}
                onValueChange={(newSpaceId) => {
                  reservations.forEach((res) => onSpaceChange(res.id, newSpaceId));
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Switch space" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {allSpaces.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.name}
                      {s.capacity != null && s.capacity > 0 && (
                        <span className="ml-1 text-gray-400">(Cap: {s.capacity})</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Day grid */}
          <div className="overflow-x-auto -mx-1 px-1">
            <SpaceDayGrid
              dates={allDates}
              reservedDates={reservedDates}
              conflictDates={conflictDates}
              isPending={isPending}
              onToggle={onToggleDay}
            />
          </div>

          {/* Time picker */}
          {reservations.length > 0 && (
            <SpaceTimePicker
              reservedDates={reservations.map((r) => r.service_date)}
              startTime={startTime}
              endTime={endTime}
              isPending={isPending}
              onSave={(start, end) =>
                onUpdateTimes(
                  reservations.map((r) => r.service_date),
                  start,
                  end
                )
              }
            />
          )}

          {/* Conflict list */}
          {hasConflict && (
            <div className="space-y-2 rounded-lg border border-[color-mix(in_srgb,var(--status-clay)_20%,transparent)] bg-[color-mix(in_srgb,var(--status-clay)_5%,transparent)] p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--status-clay)]">
                <AlertTriangle className="size-3.5" />
                {conflictsByBooking.size} conflict
                {conflictsByBooking.size !== 1 ? "s" : ""}
              </div>
              {Array.from(conflictsByBooking.entries()).map(
                ([conflictBookingId, dates]) => {
                  const blocker = conflictingBookings.find(
                    (cb) => cb.id === conflictBookingId
                  );
                  if (!blocker) return null;
                  const name =
                    blocker.customer_name ||
                    blocker.contact_name ||
                    "Unknown Group";
                  return (
                    <div
                      key={conflictBookingId}
                      className="flex flex-wrap items-center justify-between gap-2 text-sm"
                    >
                      <span className="text-gray-700">
                        <span className="font-medium">{name}</span>{" "}
                        <span className="text-gray-500">({blocker.status})</span>{" "}
                        —{" "}
                        <span className="text-gray-500">
                          {dates.map(formatConflictDate).join(", ")}
                        </span>
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-xs px-2 border-[color-mix(in_srgb,var(--status-clay)_20%,transparent)] text-[var(--status-clay)] hover:bg-[color-mix(in_srgb,var(--status-clay)_5%,transparent)] flex-shrink-0"
                        onClick={() =>
                          setResolveInfo({ conflictingBookingId: conflictBookingId, dates })
                        }
                      >
                        Resolve
                      </Button>
                    </div>
                  );
                }
              )}
            </div>
          )}

          {/* Remove button */}
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-gray-400 hover:text-red-600 hover:bg-red-50 gap-1"
              onClick={onRemove}
              disabled={isPending}
            >
              <Trash2 className="size-3" />
              Remove Space
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resolve conflict dialog */}
      {resolveConflict && resolveInfo && (
        <ResolveConflictDialog
          open={!!resolveInfo}
          onOpenChange={(open) => {
            if (!open) setResolveInfo(null);
          }}
          booking={booking}
          spaceId={spaceId}
          spaceName={space?.name ?? ""}
          conflictDates={resolveInfo.dates}
          conflictingBooking={resolveConflict}
        />
      )}
    </>
  );
}
