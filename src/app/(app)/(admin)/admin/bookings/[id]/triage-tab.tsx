"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  updateBookingStatus,
  recordDeposit,
  updateSpaceReservation,
} from "./actions";
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

interface TriageTabProps {
  booking: BookingWithMeta;
  reservations: SpaceReservation[];
  spaces: Space[];
  conflicts: Views<"v_space_conflicts">[];
  conflictingBookings: ConflictingBooking[];
}

export function TriageTab({
  booking,
  reservations,
  spaces,
  conflicts,
  conflictingBookings,
}: TriageTabProps) {
  const [isPending, startTransition] = useTransition();

  const handleApprove = () => {
    startTransition(async () => {
      await updateBookingStatus(booking.id, "Approved");
    });
  };

  const handleRecordDeposit = () => {
    startTransition(async () => {
      await recordDeposit(booking.id);
    });
  };

  const handleSpaceChange = (reservationId: string, newSpaceId: string) => {
    startTransition(async () => {
      await updateSpaceReservation(reservationId, newSpaceId);
    });
  };

  // Group reservations by space_id to handle "Whole Centre" or multi-day blocks logically
  const reservationsBySpace = reservations.reduce((acc, res) => {
    if (!acc[res.space_id]) {
      acc[res.space_id] = [];
    }
    acc[res.space_id].push(res);
    return acc;
  }, {} as Record<string, typeof reservations>);

  const totalIssues = booking.conflicts.length;

  // Filter for spaces that have issues (conflicts or capacity)
  const problematicSpaces = Object.entries(reservationsBySpace).filter(
    ([spaceId]) => {
      const currentSpace = spaces.find((s) => s.id === spaceId);
      const spaceConflicts = conflicts.filter((c) => c.space_id === spaceId);
      const hasConflict = spaceConflicts.length > 0;
      const capacity = currentSpace?.capacity || 0;
      const isOverCapacity = capacity > 0 && booking.headcount > capacity;

      return hasConflict || isOverCapacity;
    }
  );

  return (
    <div className="space-y-6">
      {/* Top Summary Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-olive-100 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-olive-900">
            Triage & Approval
          </h2>
          <p className="text-sm text-olive-600">
            Resolve {totalIssues} {totalIssues === 1 ? "conflict" : "conflicts"}{" "}
            before approving this request.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRecordDeposit}
            disabled={
              isPending ||
              booking.deposit_status === "Paid" ||
              booking.status !== "Approved"
            }
            className="border-olive-200 hover:bg-olive-50"
          >
            {booking.deposit_status === "Paid" ? (
              <span className="flex items-center gap-2 text-olive-700">
                <CheckCircle2 className="h-4 w-4" /> Deposit Paid
              </span>
            ) : (
              "Record Deposit"
            )}
          </Button>
          <Button
            onClick={handleApprove}
            disabled={
              isPending ||
              booking.status === "Approved" ||
              booking.status === "Confirmed" ||
              totalIssues > 0
            }
            className={cn(
              totalIssues > 0
                ? "opacity-50 cursor-not-allowed"
                : "bg-primary hover:bg-primary/90"
            )}
          >
            {booking.status === "Approved" || booking.status === "Confirmed" ? (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Approved
              </span>
            ) : (
              "Approve Booking"
            )}
          </Button>
        </div>
      </div>

      {/* Space Requests List */}
      <div className="space-y-4">
        {problematicSpaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-olive-200 bg-olive-50/50 p-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-olive-400 mb-4" />
            <h3 className="text-lg font-semibold text-olive-900">
              No conflicts or issues
            </h3>
            <p className="text-sm text-olive-600 max-w-sm mt-2">
              All requested spaces are available and within capacity limits. You
              can proceed with approval.
            </p>
          </div>
        ) : (
          problematicSpaces.map(([spaceId, resList]) => {
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
    </div>
  );
}
