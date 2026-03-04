"use client";

import { useTransition } from "react";
import { Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { addSpaceToBooking } from "../actions";
import type { BookingWithMeta, Space } from "@/lib/queries/bookings";

interface AddSpaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingWithMeta;
  allSpaces: Space[];
  reservedSpaceIds: Set<string>;
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

export function AddSpaceDialog({
  open,
  onOpenChange,
  booking,
  allSpaces,
  reservedSpaceIds,
}: AddSpaceDialogProps) {
  const [isPending, startTransition] = useTransition();
  const availableSpaces = allSpaces.filter((s) => !reservedSpaceIds.has(s.id));
  const totalDates = generateDates(booking.arrival_date, booking.departure_date).length;

  const handleAdd = (spaceId: string) => {
    startTransition(async () => {
      const dates = generateDates(booking.arrival_date, booking.departure_date);
      await addSpaceToBooking(booking.id, spaceId, dates);
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Space</DialogTitle>
          <DialogDescription>
            Full-day holds will be created for all {totalDates} booking date
            {totalDates !== 1 ? "s" : ""}. You can remove individual days afterwards.
          </DialogDescription>
        </DialogHeader>

        {availableSpaces.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            All spaces are already assigned to this booking.
          </p>
        ) : (
          <div className="space-y-2">
            {availableSpaces.map((space) => {
              const isOverCapacity =
                space.capacity != null &&
                space.capacity > 0 &&
                booking.headcount > space.capacity;
              return (
                <button
                  key={space.id}
                  type="button"
                  disabled={isPending}
                  onClick={() => handleAdd(space.id)}
                  className={cn(
                    "w-full flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-all text-left min-h-[44px]",
                    "hover:border-primary/30 hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed",
                    isOverCapacity
                      ? "border-amber-200 bg-amber-50/30"
                      : "border-gray-200 bg-white"
                  )}
                >
                  <div>
                    <p className="font-medium text-gray-900">{space.name}</p>
                    {space.capacity != null && space.capacity > 0 && (
                      <p
                        className={cn(
                          "text-xs",
                          isOverCapacity ? "text-amber-600" : "text-gray-500"
                        )}
                      >
                        Cap: {space.capacity}
                        {isOverCapacity ? " — over capacity" : ""}
                      </p>
                    )}
                  </div>
                  <Users className="size-4 text-gray-300 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
