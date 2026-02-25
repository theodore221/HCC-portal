"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Users,
  Calendar,
  ExternalLink,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type {
  BookingWithMeta,
  Space,
  SpaceReservation,
} from "@/lib/queries/bookings";
import type { Views } from "@/lib/database.types";

interface ConflictingBooking {
  id: string;
  reference: string | null;
  status: string;
  contact_name: string | null;
  customer_name: string | null;
}

interface SpaceRequestCardProps {
  spaceId: string;
  reservations: SpaceReservation[];
  space: Space | undefined;
  allSpaces: Space[];
  conflicts: Views<"v_space_conflicts">[];
  conflictingBookings: ConflictingBooking[];
  booking: BookingWithMeta;
  isPending: boolean;
  onSpaceChange: (reservationId: string, newSpaceId: string) => void;
}

export function SpaceRequestCard({
  spaceId,
  reservations,
  space,
  allSpaces,
  conflicts,
  conflictingBookings,
  booking,
  isPending,
  onSpaceChange,
}: SpaceRequestCardProps) {
  // Conflict Logic
  const spaceConflicts = conflicts.filter((c) => c.space_id === spaceId);
  const hasConflict = spaceConflicts.length > 0;

  // Identify the specific conflicting bookings
  const blockers = conflictingBookings.filter((cb) =>
    spaceConflicts.some((c) => c.conflicts_with === cb.id)
  );

  // Capacity Logic
  const capacity = space?.capacity || 0;
  const isOverCapacity = capacity > 0 && booking.headcount > capacity;
  const capacityPercentage = Math.min(
    100,
    Math.round((booking.headcount / capacity) * 100)
  );

  return (
    <Card
      className={cn(
        "overflow-hidden border transition-all duration-200 rounded-2xl shadow-soft",
        hasConflict
          ? "border-red-200 bg-red-50/30"
          : isOverCapacity
          ? "border-amber-200 bg-amber-50/30"
          : "border-border/70 bg-white/90"
      )}
    >
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Left: The Request Details */}
          <div className="flex-1 p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900 text-lg">
                    {space?.name}
                  </h3>
                  {hasConflict && (
                    <Badge variant="destructive" className="rounded-full px-2">
                      Conflict
                    </Badge>
                  )}
                  {!hasConflict && isOverCapacity && (
                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200 rounded-full px-2">
                      Over Capacity
                    </Badge>
                  )}
                  {!hasConflict && !isOverCapacity && (
                    <Badge
                      variant="outline"
                      className="text-gray-500 border-gray-200 bg-gray-50 rounded-full px-2"
                    >
                      Available
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Requested for{" "}
                  <span className="font-medium text-gray-700">
                    {reservations.length}{" "}
                    {reservations.length === 1 ? "day" : "days"}
                  </span>
                </p>
              </div>

              {/* Space Switcher */}
              <div className="w-[200px]">
                <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1.5 block">
                  Switch Space
                </label>
                <Select
                  disabled={isPending}
                  value={spaceId}
                  onValueChange={(newSpaceId) => {
                    reservations.forEach((res) =>
                      onSpaceChange(res.id, newSpaceId)
                    );
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select space" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {allSpaces.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                        {s.capacity && (
                          <span className="ml-2 text-muted-foreground">
                            (Cap: {s.capacity})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Capacity Visualization */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-gray-600 flex items-center gap-1.5">
                  <Users className="size-3.5" />
                  Capacity Usage
                </span>
                <span
                  className={cn(
                    "font-semibold",
                    isOverCapacity ? "text-red-600" : "text-gray-900"
                  )}
                >
                  {booking.headcount} / {capacity || "∞"} Guests
                </span>
              </div>
              <div className="h-2 w-full bg-neutral rounded-full overflow-hidden border border-black/5">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    isOverCapacity ? "bg-red-500" : "bg-primary"
                  )}
                  style={{ width: `${capacityPercentage}%` }}
                />
              </div>
              {isOverCapacity && (
                <p className="text-xs text-red-600 mt-2 flex items-center gap-1.5 bg-white/50 p-2 rounded border border-red-100">
                  <AlertTriangle className="size-3.5" />
                  This group exceeds the recommended limit for {space?.name}.
                  Consider moving to a larger space or approving as an
                  exception.
                </p>
              )}
            </div>
          </div>

          {/* Right: The Conflict Context (if any) */}
          {hasConflict && (
            <div className="relative md:w-[380px] border-t md:border-t-0 md:border-l border-red-100 bg-red-50/50 p-6">
              <div className="absolute top-6 right-6">
                <Ban className="h-16 w-16 text-red-100 -rotate-12" />
              </div>

              <h4 className="text-xs font-bold uppercase tracking-wider text-red-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="size-4" />
                Blocked By
              </h4>

              <div className="space-y-3 relative z-10">
                {blockers.map((blocker) => (
                  <div
                    key={blocker.id}
                    className="bg-white rounded-xl p-3 shadow-sm border border-red-100"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm text-gray-900">
                          {blocker.customer_name ||
                            blocker.contact_name ||
                            "Unknown Group"}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">
                          {blocker.reference}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 h-5"
                      >
                        {blocker.status}
                      </Badge>
                    </div>

                    <div className="text-xs text-gray-600 bg-neutral rounded p-2 mb-2">
                      <p className="flex items-center gap-1.5">
                        <Calendar className="size-3" />
                        {
                          spaceConflicts.filter(
                            (c) => c.conflicts_with === blocker.id
                          ).length
                        }{" "}
                        overlap dates
                      </p>
                    </div>

                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="w-full justify-between text-xs h-7 hover:bg-gray-50 text-gray-500"
                    >
                      <Link
                        href={`/admin/bookings/${blocker.id}`}
                        target="_blank"
                      >
                        View booking <ExternalLink className="size-3 ml-2" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
