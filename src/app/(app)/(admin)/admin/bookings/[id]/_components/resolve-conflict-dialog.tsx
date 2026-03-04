"use client";

import { useState, useTransition } from "react";
import { Clock, Calendar, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusChip } from "@/components/ui/status-chip";
import { updateReservationTimes, toggleReservationDays } from "../actions";
import type { BookingWithMeta } from "@/lib/queries/bookings";
import type { BookingStatus } from "@/lib/queries/bookings";

interface ConflictingBooking {
  id: string;
  reference: string | null;
  status: string;
  contact_name: string | null;
  customer_name: string | null;
  headcount: number;
}

interface ResolveConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingWithMeta;
  spaceId: string;
  spaceName: string;
  conflictDates: string[];
  conflictingBooking: ConflictingBooking;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y!, m! - 1, d!);
  return date.toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function ResolveConflictDialog({
  open,
  onOpenChange,
  booking,
  spaceId,
  spaceName,
  conflictDates,
  conflictingBooking,
}: ResolveConflictDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [myStart, setMyStart] = useState("09:00");
  const [myEnd, setMyEnd] = useState("12:00");
  const [otherStart, setOtherStart] = useState("13:00");
  const [otherEnd, setOtherEnd] = useState("17:00");

  const displayName =
    conflictingBooking.customer_name ||
    conflictingBooking.contact_name ||
    "Unknown Group";

  const datesSummary =
    conflictDates.length === 1
      ? formatDate(conflictDates[0]!)
      : `${conflictDates.length} dates: ${conflictDates.map(formatDate).join(", ")}`;

  const handleSetTimeslots = () => {
    startTransition(async () => {
      await Promise.all([
        updateReservationTimes(booking.id, spaceId, conflictDates, myStart, myEnd),
        updateReservationTimes(
          conflictingBooking.id,
          spaceId,
          conflictDates,
          otherStart,
          otherEnd
        ),
      ]);
      onOpenChange(false);
    });
  };

  const handleRemoveDays = () => {
    startTransition(async () => {
      await toggleReservationDays(booking.id, spaceId, [], conflictDates);
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Resolve Conflict: {spaceName}</DialogTitle>
          <DialogDescription>{datesSummary}</DialogDescription>
        </DialogHeader>

        {/* Booking comparison */}
        <div className="grid grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
              This Booking
            </p>
            <p className="font-medium text-gray-900 truncate">
              {booking.customer_name || booking.contact_name || "This booking"}
            </p>
            <p className="text-xs text-gray-500 font-mono">{booking.reference}</p>
            <div className="mt-1.5">
              <StatusChip status={booking.status as BookingStatus} />
            </div>
            <p className="text-xs text-gray-500 mt-1">{booking.headcount} guests</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
              Conflicting Booking
            </p>
            <p className="font-medium text-gray-900 truncate">{displayName}</p>
            <p className="text-xs text-gray-500 font-mono">
              {conflictingBooking.reference}
            </p>
            <div className="mt-1.5">
              <StatusChip status={conflictingBooking.status as BookingStatus} />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {conflictingBooking.headcount} guests
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Option 1: Set time slots */}
          <div className="rounded-lg border border-gray-200 p-3 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Clock className="size-4 text-gray-400" />
              Set time slots to avoid overlap
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">This booking</Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="time"
                    value={myStart}
                    onChange={(e) => setMyStart(e.target.value)}
                    className="h-7 text-xs"
                    disabled={isPending}
                  />
                  <span className="text-gray-400 text-xs flex-shrink-0">–</span>
                  <Input
                    type="time"
                    value={myEnd}
                    onChange={(e) => setMyEnd(e.target.value)}
                    className="h-7 text-xs"
                    disabled={isPending}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Other booking</Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="time"
                    value={otherStart}
                    onChange={(e) => setOtherStart(e.target.value)}
                    className="h-7 text-xs"
                    disabled={isPending}
                  />
                  <span className="text-gray-400 text-xs flex-shrink-0">–</span>
                  <Input
                    type="time"
                    value={otherEnd}
                    onChange={(e) => setOtherEnd(e.target.value)}
                    className="h-7 text-xs"
                    disabled={isPending}
                  />
                </div>
              </div>
            </div>
            <Button
              size="sm"
              className="w-full"
              onClick={handleSetTimeslots}
              disabled={isPending}
            >
              {isPending ? "Applying..." : "Apply Time Slots"}
            </Button>
          </div>

          {/* Option 2: Remove conflicting days */}
          <div className="rounded-lg border border-gray-200 p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Calendar className="size-4 text-gray-400 flex-shrink-0" />
              Remove conflicting days from this booking
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoveDays}
              disabled={isPending}
              className="flex-shrink-0"
            >
              Remove Days
            </Button>
          </div>

          {/* Option 3: Open other booking */}
          <div className="rounded-lg border border-gray-200 p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <ExternalLink className="size-4 text-gray-400 flex-shrink-0" />
              Open other booking to resolve manually
            </div>
            <Button variant="outline" size="sm" asChild className="flex-shrink-0">
              <a
                href={`/admin/bookings/${conflictingBooking.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open →
              </a>
            </Button>
          </div>
        </div>

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
