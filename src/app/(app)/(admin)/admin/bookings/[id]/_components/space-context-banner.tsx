"use client";

import { formatDateRange } from "@/lib/utils";
import type { BookingWithMeta, Space, SpaceReservation } from "@/lib/queries/bookings";

interface SpaceContextBannerProps {
  booking: BookingWithMeta;
  reservations: SpaceReservation[];
  spaces: Space[];
}

export function SpaceContextBanner({
  booking,
  reservations,
  spaces,
}: SpaceContextBannerProps) {
  const reservedSpaceIds = new Set(reservations.map((r) => r.space_id));
  const reservedSpaces = spaces.filter((s) => reservedSpaceIds.has(s.id));
  const dateRange = formatDateRange(booking.arrival_date, booking.departure_date);

  const minCapacity =
    reservedSpaces.length > 0
      ? Math.min(...reservedSpaces.map((s) => s.capacity || Infinity))
      : null;
  const isOverCapacity =
    minCapacity !== null &&
    minCapacity !== Infinity &&
    booking.headcount > minCapacity;

  if (booking.whole_centre) {
    return (
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-semibold text-primary">
            Whole Centre Booking
          </span>
          <span className="text-sm text-gray-700">
            All {reservedSpaceIds.size} space{reservedSpaceIds.size !== 1 ? "s" : ""} reserved
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
          <span>{dateRange}</span>
          <span className="text-gray-400">·</span>
          <span>{booking.headcount} guests</span>
          {isOverCapacity && (
            <span className="text-xs font-medium text-[var(--status-clay)]">
              ⚠ Exceeds smallest space capacity
            </span>
          )}
        </div>
      </div>
    );
  }

  const spaceNames = reservedSpaces.map((s) => s.name).join(", ");

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center rounded-full bg-white border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600">
          Individual Spaces ({reservedSpaceIds.size} of {spaces.length})
        </span>
        {spaceNames && (
          <span className="text-sm text-gray-600 hidden sm:block truncate max-w-xs">
            {spaceNames}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
        <span>{dateRange}</span>
        <span className="text-gray-400">·</span>
        <span>{booking.headcount} guests</span>
        {isOverCapacity && (
          <span className="text-xs font-medium text-[var(--status-clay)]">
            ⚠ Over capacity
          </span>
        )}
      </div>
    </div>
  );
}
