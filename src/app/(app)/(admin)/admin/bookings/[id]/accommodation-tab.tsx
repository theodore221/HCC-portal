"use client";

import { useState } from "react";
import { RoomWithAssignments, BookingWithMeta } from "@/lib/queries/bookings";
import { Tables } from "@/lib/database.types";
import { RoomAllocationGrid } from "./_components/room-allocation-grid";
import { AccommodationRequestsCard } from "./_components/accommodation-requests-card";
import type { RoomConflict } from "./client";

export interface RoomWithMeta extends Tables<"rooms"> {
  room_types: Tables<"room_types"> | null;
  level?: string | null;
  room_number?: string | null;
  wing?: string | null;
  // Additional fields from rooms table (until types regenerated)
  ensuite_available?: boolean;
  ensuite_fee?: number | null;
  private_study_available?: boolean;
  private_study_fee?: number | null;
}

interface AccommodationTabProps {
  booking: BookingWithMeta;
  rooms: RoomWithAssignments[];
  allRooms: RoomWithMeta[];
  roomingGroups: Tables<"rooming_groups">[];
  roomConflicts: RoomConflict[];
  roomConflictingBookings: {
    id: string;
    reference: string | null;
    status: string;
    customer_name: string | null;
    contact_name: string | null;
    arrival_date: string;
    departure_date: string;
  }[];
}

export function AccommodationTab({
  booking,
  rooms,
  allRooms,
  roomConflicts,
  roomConflictingBookings,
}: AccommodationTabProps) {
  // Parse accommodation requests with defaults
  const accommodationRequests = (booking.accommodation_requests as Record<string, number | boolean>) || {};
  const requests = {
    doubleBB: (accommodationRequests.doubleBB as number) || 0,
    singleBB: (accommodationRequests.singleBB as number) || 0,
    studySuite: (accommodationRequests.studySuite as number) || 0,
    doubleEnsuite: (accommodationRequests.doubleEnsuite as number) || 0,
    byo_linen: (accommodationRequests.byo_linen as boolean) || false,
  };

  // Track allocated counts
  const [allocatedCounts, setAllocatedCounts] = useState({
    doubleBB: 0,
    singleBB: 0,
    studySuite: 0,
    doubleEnsuite: 0,
  });

  return (
    <div className="space-y-6">
      {/* Accommodation Requests Card */}
      <AccommodationRequestsCard
        bookingId={booking.id}
        requests={requests}
        allocated={allocatedCounts}
      />

      {/* Room Allocation Grid */}
      <RoomAllocationGrid
        booking={booking}
        rooms={rooms}
        allRooms={allRooms}
        roomConflicts={roomConflicts}
        roomConflictingBookings={roomConflictingBookings}
        onAllocatedCountsChange={setAllocatedCounts}
      />
    </div>
  );
}
