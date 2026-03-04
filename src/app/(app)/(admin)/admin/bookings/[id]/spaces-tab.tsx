"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  updateSpaceReservation,
  toggleReservationDays,
  removeSpaceFromBooking,
  updateReservationTimes,
} from "./actions";
import { SpaceContextBanner } from "./_components/space-context-banner";
import { SpaceGridView } from "./_components/space-grid-view";
import { AddSpaceDialog } from "./_components/add-space-dialog";
import { SpaceRequestCard } from "./space-request-card";
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

interface SpacesTabProps {
  booking: BookingWithMeta;
  reservations: SpaceReservation[];
  spaces: Space[];
  conflicts: Views<"v_space_conflicts">[];
  conflictingBookings: ConflictingBooking[];
}

export function SpacesTab({
  booking,
  reservations,
  spaces,
  conflicts,
  conflictingBookings,
}: SpacesTabProps) {
  const [isPending, startTransition] = useTransition();
  const [isAddSpaceOpen, setIsAddSpaceOpen] = useState(false);

  // Group reservations by space_id
  const reservationsBySpace = new Map<string, SpaceReservation[]>();
  for (const res of reservations) {
    if (!reservationsBySpace.has(res.space_id)) {
      reservationsBySpace.set(res.space_id, []);
    }
    reservationsBySpace.get(res.space_id)!.push(res);
  }
  const reservedSpaceIds = new Set(reservationsBySpace.keys());

  // Grid view for whole-centre bookings or 5+ spaces
  const useGridView = booking.whole_centre || reservedSpaceIds.size >= 5;

  const handleSpaceChange = (reservationId: string, newSpaceId: string) => {
    startTransition(async () => {
      await updateSpaceReservation(reservationId, newSpaceId);
    });
  };

  const handleToggleDay = (spaceId: string, date: string, isAdding: boolean) => {
    startTransition(async () => {
      await toggleReservationDays(
        booking.id,
        spaceId,
        isAdding ? [date] : [],
        isAdding ? [] : [date]
      );
    });
  };

  const handleRemoveSpace = (spaceId: string) => {
    startTransition(async () => {
      try {
        await removeSpaceFromBooking(booking.id, spaceId);
        toast.success("Space removed");
      } catch {
        toast.error("Failed to remove space");
      }
    });
  };

  const handleUpdateTimes = (
    spaceId: string,
    dates: string[],
    startTime: string | null,
    endTime: string | null
  ) => {
    startTransition(async () => {
      try {
        await updateReservationTimes(booking.id, spaceId, dates, startTime, endTime);
        toast.success("Times updated");
      } catch {
        toast.error("Failed to update times");
      }
    });
  };

  return (
    <section className="space-y-4">
      {/* Context banner */}
      <SpaceContextBanner
        booking={booking}
        reservations={reservations}
        spaces={spaces}
      />

      {/* Empty state */}
      {reservedSpaceIds.size === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-12 text-center">
          <p className="text-sm text-gray-500">No spaces assigned to this booking.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 gap-2"
            onClick={() => setIsAddSpaceOpen(true)}
          >
            <Plus className="size-3.5" />
            Add Space
          </Button>
        </div>
      )}

      {/* Grid view — whole-centre or 5+ spaces */}
      {useGridView && reservedSpaceIds.size > 0 && (
        <div className="rounded-2xl border border-border/70 bg-white/90 p-6 shadow-soft">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-light">
            Manage Spaces
          </h3>
          <SpaceGridView
            booking={booking}
            spaces={spaces}
            reservations={reservations}
            conflicts={conflicts}
            onAddSpace={() => setIsAddSpaceOpen(true)}
          />
        </div>
      )}

      {/* Card view — individual spaces (1–4) */}
      {!useGridView && reservedSpaceIds.size > 0 && (
        <div className="space-y-4">
          {Array.from(reservationsBySpace.entries()).map(([spaceId, resList]) => {
            const currentSpace = spaces.find((s) => s.id === spaceId);
            const spaceConflicts = conflicts.filter((c) => c.space_id === spaceId);

            return (
              <SpaceRequestCard
                key={spaceId}
                spaceId={spaceId}
                reservations={resList}
                space={currentSpace}
                allSpaces={spaces}
                booking={booking}
                conflicts={spaceConflicts}
                conflictingBookings={conflictingBookings}
                isPending={isPending}
                onSpaceChange={handleSpaceChange}
                onToggleDay={(date, isAdding) =>
                  handleToggleDay(spaceId, date, isAdding)
                }
                onRemove={() => handleRemoveSpace(spaceId)}
                onUpdateTimes={(dates, start, end) =>
                  handleUpdateTimes(spaceId, dates, start, end)
                }
              />
            );
          })}

          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-dashed w-full"
            onClick={() => setIsAddSpaceOpen(true)}
            disabled={isPending}
          >
            <Plus className="size-3.5" />
            Add Space
          </Button>
        </div>
      )}

      <AddSpaceDialog
        open={isAddSpaceOpen}
        onOpenChange={setIsAddSpaceOpen}
        booking={booking}
        allSpaces={spaces}
        reservedSpaceIds={reservedSpaceIds}
      />
    </section>
  );
}
