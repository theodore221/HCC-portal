"use client";

import { useState } from "react";
import type { BookingWithMeta, RoomWithAssignments } from "@/lib/queries/bookings";
import { AccommodationRequestsCard } from "./accommodation-requests-card";
import { RoomAllocationGrid } from "./room-allocation-grid";

interface CustomerAccommodationTabProps {
  booking: BookingWithMeta;
  rooms: RoomWithAssignments[];
}

export function CustomerAccommodationTab({
  booking,
  rooms,
}: CustomerAccommodationTabProps) {
  const accommodationRequests =
    (booking.accommodation_requests as Record<string, number | boolean>) || {};
  const requests = {
    doubleBB: (accommodationRequests.doubleBB as number) || 0,
    singleBB: (accommodationRequests.singleBB as number) || 0,
    studySuite: (accommodationRequests.studySuite as number) || 0,
    doubleEnsuite: (accommodationRequests.doubleEnsuite as number) || 0,
    byo_linen: (accommodationRequests.byo_linen as boolean) || false,
  };

  const [allocatedCounts, setAllocatedCounts] = useState({
    doubleBB: 0,
    singleBB: 0,
    studySuite: 0,
    doubleEnsuite: 0,
  });

  return (
    <div className="space-y-6">
      <AccommodationRequestsCard
        bookingId={booking.id}
        requests={requests}
        allocated={allocatedCounts}
      />

      <RoomAllocationGrid
        bookingId={booking.id}
        rooms={rooms}
        onAllocatedCountsChange={setAllocatedCounts}
      />
    </div>
  );
}
