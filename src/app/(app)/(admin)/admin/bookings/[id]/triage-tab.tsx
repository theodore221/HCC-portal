"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  AlertTriangle,
  Users,
  Calendar,
  ArrowRight,
  ArrowRightLeft,
  ExternalLink,
  Info,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { cn } from "@/lib/utils";

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
        {Object.entries(reservationsBySpace).map(([spaceId, resList]) => {
          const currentSpace = spaces.find((s) => s.id === spaceId);

          // Conflict Logic
          const spaceConflicts = conflicts.filter(
            (c) => c.space_id === spaceId
          );
          const hasConflict = spaceConflicts.length > 0;

          // Identify the specific conflicting bookings
          const blockers = conflictingBookings.filter((cb) =>
            spaceConflicts.some((c) => c.conflicts_with === cb.id)
          );

          // Capacity Logic
          const capacity = currentSpace?.capacity || 0;
          const isOverCapacity = capacity > 0 && booking.headcount > capacity;
          const capacityPercentage = Math.min(
            100,
            Math.round((booking.headcount / capacity) * 100)
          );

          return (
            <Card
              key={spaceId}
              className={cn(
                "overflow-hidden border transition-all duration-200",
                hasConflict
                  ? "border-red-200 bg-red-50/30 shadow-sm"
                  : isOverCapacity
                  ? "border-amber-200 bg-amber-50/30"
                  : "border-olive-100 bg-white"
              )}
            >
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  {/* Left: The Request Details */}
                  <div className="flex-1 p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-olive-900 text-lg">
                            {currentSpace?.name}
                          </h3>
                          {hasConflict && (
                            <Badge
                              variant="destructive"
                              className="rounded-full px-2"
                            >
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
                              className="text-olive-600 border-olive-200 bg-olive-50 rounded-full px-2"
                            >
                              Available
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-olive-600 mt-1">
                          Requested for{" "}
                          <span className="font-medium text-olive-800">
                            {resList.length}{" "}
                            {resList.length === 1 ? "day" : "days"}
                          </span>
                        </p>
                      </div>

                      {/* Space Switcher */}
                      <div className="w-[200px]">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-olive-500 mb-1.5 block">
                          Switch Space
                        </label>
                        <Select
                          disabled={isPending}
                          value={spaceId}
                          onValueChange={(newSpaceId) => {
                            resList.forEach((res) =>
                              handleSpaceChange(res.id, newSpaceId)
                            );
                          }}
                        >
                          <SelectTrigger className="h-9 bg-white border-olive-200 text-sm shadow-sm">
                            <SelectValue placeholder="Select space" />
                          </SelectTrigger>
                          <SelectContent>
                            {spaces.map((space) => (
                              <SelectItem key={space.id} value={space.id}>
                                <div className="flex items-center justify-between w-full gap-4">
                                  <span>{space.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    Cap: {space.capacity ?? "-"}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Capacity Visualization */}
                    <div className="mt-6">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-medium text-olive-700 flex items-center gap-1.5">
                          <Users className="size-3.5" />
                          Capacity Usage
                        </span>
                        <span
                          className={cn(
                            "font-semibold",
                            isOverCapacity ? "text-red-600" : "text-olive-900"
                          )}
                        >
                          {booking.headcount} / {capacity || "∞"} Guests
                        </span>
                      </div>
                      <div className="h-2 w-full bg-neutral rounded-full overflow-hidden border border-black/5">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            isOverCapacity ? "bg-red-500" : "bg-olive-500"
                          )}
                          style={{ width: `${capacityPercentage}%` }}
                        />
                      </div>
                      {isOverCapacity && (
                        <p className="text-xs text-red-600 mt-2 flex items-center gap-1.5 bg-white/50 p-2 rounded border border-red-100">
                          <AlertTriangle className="size-3.5" />
                          This group exceeds the recommended limit for{" "}
                          {currentSpace?.name}. Consider moving to a larger
                          space or approving as an exception.
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
                                <p className="font-semibold text-sm text-olive-900">
                                  {blocker.customer_name ||
                                    blocker.contact_name ||
                                    "Unknown Group"}
                                </p>
                                <p className="text-xs text-olive-500 font-mono">
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

                            <div className="text-xs text-olive-700 bg-neutral rounded p-2 mb-2">
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
                              className="w-full justify-between text-xs h-7 hover:bg-olive-50 text-olive-600"
                            >
                              <Link
                                href={`/admin/bookings/${blocker.id}`}
                                target="_blank"
                              >
                                View booking{" "}
                                <ExternalLink className="size-3 ml-2" />
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
        })}
      </div>
    </div>
  );
}
