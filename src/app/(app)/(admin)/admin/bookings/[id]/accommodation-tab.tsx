"use client";

import { RoomWithAssignments, BookingWithMeta } from "@/lib/queries/bookings";
import { Tables } from "@/lib/database.types";
import { RoomAllocationGrid } from "./_components/room-allocation-grid";
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
  roomingGroups,
  roomConflicts,
  roomConflictingBookings,
}: AccommodationTabProps) {
  return (
    <RoomAllocationGrid
      booking={booking}
      rooms={rooms}
      allRooms={allRooms}
      roomConflicts={roomConflicts}
      roomConflictingBookings={roomConflictingBookings}
    />
  );
}
