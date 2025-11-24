"use client";

import { useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { updateSpaceReservation } from "./actions";
import type {
  BookingWithMeta,
  Space,
  SpaceReservation,
} from "@/lib/queries/bookings";
import type { Views } from "@/lib/database.types";
import { SpaceRequestCard } from "./space-request-card";

interface ConflictingBooking {
  id: string;
  reference: string | null;
  status: string;
  contact_name: string | null;
  customer_name: string | null;
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

  const handleSpaceChange = (reservationId: string, newSpaceId: string) => {
    startTransition(async () => {
      await updateSpaceReservation(reservationId, newSpaceId);
    });
  };

  // Group reservations by space_id
  const reservationsBySpace = reservations.reduce((acc, res) => {
    if (!acc[res.space_id]) {
      acc[res.space_id] = [];
    }
    acc[res.space_id].push(res);
    return acc;
  }, {} as Record<string, typeof reservations>);

  // Show ALL spaces
  const allSpaceEntries = Object.entries(reservationsBySpace);

  return (
    <section className="rounded-2xl border border-border/70 bg-white/90 p-6 shadow-soft">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-light">
        Manage Spaces
      </h3>

      <div className="space-y-4">
        {allSpaceEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-12 text-center">
            <p className="text-sm text-neutral-500">
              No spaces requested for this booking.
            </p>
          </div>
        ) : (
          allSpaceEntries.map(([spaceId, resList]) => {
            const currentSpace = spaces.find((s) => s.id === spaceId);
            return (
              <SpaceRequestCard
                key={spaceId}
                spaceId={spaceId}
                reservations={resList}
                space={currentSpace}
                allSpaces={spaces}
                conflicts={conflicts}
                conflictingBookings={conflictingBookings}
                booking={booking}
                isPending={isPending}
                onSpaceChange={handleSpaceChange}
              />
            );
          })
        )}
      </div>
    </section>
  );
}
