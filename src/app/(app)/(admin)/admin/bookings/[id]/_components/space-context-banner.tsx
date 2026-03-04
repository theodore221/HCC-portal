"use client";

import { useState, useTransition } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { formatDateRange } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toggleWholeCentre } from "../actions";
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
  const [isPending, startTransition] = useTransition();
  const [pendingToggle, setPendingToggle] = useState<boolean | null>(null);

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

  const handleToggle = (newValue: boolean) => {
    setPendingToggle(newValue);
  };

  const handleConfirm = () => {
    if (pendingToggle === null) return;
    const value = pendingToggle;
    setPendingToggle(null);
    startTransition(async () => {
      try {
        await toggleWholeCentre(booking.id, value);
        toast.success(value ? "Switched to Whole Centre booking" : "Switched to Individual Spaces");
      } catch {
        toast.error("Failed to update booking mode");
      }
    });
  };

  const toWholeCenter = pendingToggle === true;
  const dialogTitle = toWholeCenter ? "Switch to Whole Centre?" : "Switch to Individual Spaces?";
  const dialogDescription = toWholeCenter
    ? "All active spaces will be reserved for every date in this booking. Your current space selections will be cleared."
    : "All current space reservations will be cleared. You can then add individual spaces manually.";

  const renderSwitch = (checked: boolean) => (
    <div className="flex items-center gap-1.5 ml-1">
      <span className="text-xs text-white/70">Whole Centre</span>
      <Switch
        checked={checked}
        onCheckedChange={handleToggle}
        disabled={isPending}
        className="data-[state=checked]:bg-white/30 data-[state=unchecked]:bg-white/20 border-white/20"
      />
    </div>
  );

  return (
    <>
      {/* Confirm dialog */}
      <Dialog open={pendingToggle !== null} onOpenChange={(open) => { if (!open) setPendingToggle(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription className="pt-1">{dialogDescription}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setPendingToggle(null)}>
              Cancel
            </Button>
            <Button
              className="bg-primary text-white hover:bg-primary/90"
              onClick={handleConfirm}
              disabled={isPending}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {booking.whole_centre ? (
        <div className="rounded-xl bg-primary px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center rounded-full bg-white/20 border border-white/15 px-2.5 py-1 text-xs font-semibold text-white">
              Whole Centre Booking
            </span>
            <span className="text-sm text-white/80">
              All {reservedSpaceIds.size} space{reservedSpaceIds.size !== 1 ? "s" : ""} reserved
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
            <span>{dateRange}</span>
            <span className="text-white/50">·</span>
            <span>{booking.headcount} guests</span>
            {isOverCapacity && (
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-white/20 rounded px-1.5 py-0.5 text-white">
                <AlertTriangle className="size-3" />
                Exceeds smallest space capacity
              </span>
            )}
            {renderSwitch(true)}
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-primary px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center rounded-full bg-white/20 border border-white/15 px-2.5 py-1 text-xs font-semibold text-white">
              Individual Spaces ({reservedSpaceIds.size} of {spaces.length})
            </span>
            {reservedSpaces.length > 0 && (
              <span className="text-sm text-white/80 hidden sm:block truncate max-w-xs">
                {reservedSpaces.map((s) => s.name).join(", ")}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
            <span>{dateRange}</span>
            <span className="text-white/50">·</span>
            <span>{booking.headcount} guests</span>
            {isOverCapacity && (
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-white/20 rounded px-1.5 py-0.5 text-white">
                <AlertTriangle className="size-3" />
                Over capacity
              </span>
            )}
            {renderSwitch(false)}
          </div>
        </div>
      )}
    </>
  );
}
