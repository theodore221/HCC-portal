"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
  DollarSign,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConflictBanner } from "@/components/ui/conflict-banner";
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
import type { Tables, Views } from "@/lib/database.types";

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

  // Group reservations by space_id
  const reservationsBySpace = reservations.reduce((acc, res) => {
    if (!acc[res.space_id]) {
      acc[res.space_id] = [];
    }
    acc[res.space_id].push(res);
    return acc;
  }, {} as Record<string, typeof reservations>);

  // Group conflicts by space_id for easy lookup
  const conflictsBySpace = conflicts.reduce((acc, conflict) => {
    if (conflict.space_id) {
      if (!acc[conflict.space_id]) {
        acc[conflict.space_id] = [];
      }
      acc[conflict.space_id].push(conflict);
    }
    return acc;
  }, {} as Record<string, typeof conflicts>);

  return (
    <div className="space-y-8 rounded-2xl border border-border/70 bg-white/90 p-6 shadow-soft">
      <section>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-light">
          Conflict review
        </h3>
        {booking.conflicts.length > 0 && (
          <ConflictBanner issues={booking.conflicts} />
        )}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {/* Requested Spaces */}
        <div className="rounded-2xl border border-border/70 bg-neutral p-5">
          <p className="mb-4 text-sm font-semibold text-text">
            Requested spaces
          </p>
          <div className="space-y-4">
            {Object.entries(reservationsBySpace).length > 0 ? (
              Object.entries(reservationsBySpace).map(([spaceId, resList]) => {
                const currentSpace = spaces.find((s) => s.id === spaceId);
                const spaceConflicts = conflictsBySpace[spaceId] || [];
                const hasConflict = spaceConflicts.length > 0;

                // Get unique conflicting bookings for this space
                const spaceConflictingBookings = conflictingBookings.filter(
                  (cb) => spaceConflicts.some((c) => c.conflicts_with === cb.id)
                );

                return (
                  <div
                    key={spaceId}
                    className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <Select
                          disabled={isPending}
                          value={spaceId}
                          onValueChange={(newSpaceId) => {
                            // Update all reservations for this space to the new space
                            resList.forEach((res) =>
                              handleSpaceChange(res.id, newSpaceId)
                            );
                          }}
                        >
                          <SelectTrigger className="h-9 w-full border-none bg-transparent p-0 text-base font-semibold text-text shadow-none focus:ring-0">
                            <SelectValue placeholder="Select a space">
                              {currentSpace?.name}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {spaces.map((space) => (
                              <SelectItem key={space.id} value={space.id}>
                                {space.name} ({space.capacity} cap)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasConflict && (
                          <span className="flex items-center rounded-full bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Conflict
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dates List */}
                    <div className="space-y-1 pl-1">
                      {resList.map((res) => (
                        <div
                          key={res.id}
                          className="flex items-center text-sm text-text-light"
                        >
                          <span className="w-24 font-medium">
                            {new Date(res.service_date).toLocaleDateString(
                              undefined,
                              {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </span>
                          <span>
                            {res.start_time && res.end_time
                              ? `${res.start_time.slice(
                                  0,
                                  5
                                )} - ${res.end_time.slice(0, 5)}`
                              : "All day"}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Conflict Details */}
                    {hasConflict && (
                      <div className="mt-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                        <p className="mb-2 text-xs font-semibold text-destructive">
                          Conflicts with:
                        </p>
                        <div className="space-y-2">
                          {spaceConflictingBookings.map((cb) => (
                            <div
                              key={cb.id}
                              className="flex flex-col gap-1 text-xs text-text"
                            >
                              <div className="flex items-center justify-between font-medium">
                                <span>
                                  {cb.reference || "No Ref"} •{" "}
                                  {cb.contact_name ||
                                    cb.customer_name ||
                                    "Unknown Contact"}
                                </span>
                                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] border border-border/50">
                                  {cb.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-text-light">No spaces assigned yet.</p>
            )}
          </div>
        </div>

        {/* Capacity & Warnings */}
        <div className="rounded-2xl border border-border/70 bg-neutral p-5">
          <p className="mb-4 text-sm font-semibold text-text">
            Capacity & warnings
          </p>
          <ul className="space-y-3 text-sm text-text">
            {Object.entries(reservationsBySpace).map(([spaceId, resList]) => {
              const space = spaces.find((s) => s.id === spaceId);
              if (!space) return null;
              const isOverCapacity =
                space.capacity && booking.headcount > space.capacity;

              return (
                <li
                  key={spaceId}
                  className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm"
                >
                  <span>{space.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-light">
                      {booking.headcount} / {space.capacity || "—"}
                    </span>
                    {isOverCapacity ? (
                      <span className="flex items-center text-xs font-bold text-destructive">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Over cap
                      </span>
                    ) : (
                      <span className="flex items-center text-xs font-bold text-success">
                        <Check className="mr-1 h-3 w-3" />
                        OK
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
            {Object.keys(reservationsBySpace).length === 0 && (
              <li className="text-xs text-text-light">
                No spaces to check capacity for.
              </li>
            )}
          </ul>
        </div>
      </section>

      <div className="flex flex-wrap gap-3 pt-4">
        <Button
          onClick={handleApprove}
          disabled={isPending || booking.status === "Approved"}
          className="gap-2"
        >
          <CheckCircle2 className="h-4 w-4" />
          {booking.status === "Approved" ? "Approved" : "Approve booking"}
        </Button>
        <Button
          variant="outline"
          onClick={handleRecordDeposit}
          disabled={
            isPending ||
            booking.deposit_status === "Paid" ||
            booking.status !== "Approved"
          }
          className="gap-2"
        >
          <DollarSign className="h-4 w-4" />
          {booking.deposit_status === "Paid"
            ? "Deposit recorded"
            : "Record deposit"}
        </Button>
      </div>
    </div>
  );
}
