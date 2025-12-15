"use client";

import { RoomWithAssignments, BookingWithMeta } from "@/lib/queries/bookings";
import { Tables } from "@/lib/database.types";
import { RoomAllocationTable } from "./_components/room-allocation-table";

interface AccommodationTabProps {
  booking: BookingWithMeta;
  rooms: RoomWithAssignments[];
  allRooms: (Tables<"rooms"> & {
    room_types: Tables<"room_types"> | null;
    level?: string | null;
    room_number?: string | null;
    wing?: string | null;
  })[];
  roomingGroups: Tables<"rooming_groups">[];
}

export function AccommodationTab({
  booking,
  rooms,
  allRooms,
  roomingGroups,
}: AccommodationTabProps) {
  return (
    <RoomAllocationTable booking={booking} rooms={rooms} allRooms={allRooms} />
  );
}
