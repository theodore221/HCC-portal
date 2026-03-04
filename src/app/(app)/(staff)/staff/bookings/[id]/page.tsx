import { notFound } from "next/navigation";
import { sbServer } from "@/lib/supabase-server";

import { enrichMealJobs } from "@/lib/catering";
import { getBookingDisplayName } from "@/lib/queries/bookings";
import {
  getBookingById,
  getMealJobsForBooking,
  getRoomsForBooking,
} from "@/lib/queries/bookings.server";
import { getCateringOptions } from "@/lib/queries/catering.server";
import BookingDetailClient from "./client";

import type { Space, SpaceReservation } from "@/lib/queries/bookings";
import type { Views } from "@/lib/database.types";

export default async function StaffBookingDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const booking = await getBookingById(id);
  if (!booking) return notFound();

  const displayName = getBookingDisplayName(booking);
  const supabase: any = await sbServer();

  // Parallelize all data fetching after getting the booking
  const [
    mealJobsRaw,
    rooms,
    cateringOptions,
    { data: allSpaces },
    { data: allRooms },
    { data: bookingReservations },
    { data: rawConflicts },
    { data: roomingGroups },
    { data: roomAssignmentsForOthers },
  ] = await Promise.all([
    getMealJobsForBooking(booking.id),
    getRoomsForBooking(booking.id),
    getCateringOptions(),
    supabase
      .from("spaces")
      .select("id, name, capacity")
      .eq("active", true)
      .order("name"),
    // Fetch ALL rooms (including inactive) for display
    supabase.from("rooms").select("*, room_types(*)").order("room_number"),
    supabase
      .from("space_reservations")
      .select("*")
      .eq("booking_id", booking.id),
    // Fetch space conflicts from enriched view
    supabase
      .from("v_space_conflicts")
      .select("*")
      .eq("booking_id", booking.id),
    supabase.from("rooming_groups").select("*").eq("booking_id", booking.id),
    // Fetch room assignments for OTHER bookings to detect conflicts
    supabase
      .from("room_assignments")
      .select(
        "room_id, booking_id, booking:bookings(id, status, arrival_date, departure_date, reference, customer_name, contact_name)"
      )
      .neq("booking_id", booking.id),
  ]);

  const mealJobs = enrichMealJobs(mealJobsRaw, [booking]);

  const myReservations = (bookingReservations as SpaceReservation[]) ?? [];

  // Priority filter: Confirmed/Approved bookings ignore Pending conflicts
  const conflicts = ((rawConflicts as Views<"v_space_conflicts">[]) ?? []).filter((c) => {
    const iAmPriority =
      booking.status === "Confirmed" || booking.status === "Approved";
    return !(iAmPriority && c.other_status === "Pending");
  });

  // 3. Fetch details for conflicting bookings (spaces)
  const conflictingBookingIds = Array.from(
    new Set(conflicts.map((c) => c.conflicts_with).filter(Boolean) as string[])
  );

  let conflictingBookingsData: any[] = [];

  if (conflictingBookingIds.length > 0) {
    const { data } = await supabase
      .from("bookings")
      .select("id, reference, status, contact_name, customer_name, headcount")
      .in("id", conflictingBookingIds);
    if (data) {
      conflictingBookingsData = data;
    }
  }

  // 4. Compute Room Conflicts
  interface RoomConflict {
    room_id: string;
    conflicts_with: string;
    conflicting_booking: {
      id: string;
      reference: string | null;
      status: string;
      customer_name: string | null;
      contact_name: string | null;
      arrival_date: string;
      departure_date: string;
    };
  }

  const roomConflicts: RoomConflict[] = [];
  const roomConflictingBookingsMap = new Map<string, any>();

  for (const assignment of roomAssignmentsForOthers ?? []) {
    const otherBooking = assignment.booking as any;
    if (!otherBooking || otherBooking.status === "Cancelled") continue;

    // Check date overlap
    const hasOverlap =
      otherBooking.arrival_date < booking.departure_date &&
      otherBooking.departure_date > booking.arrival_date;

    if (hasOverlap) {
      roomConflicts.push({
        room_id: assignment.room_id,
        conflicts_with: otherBooking.id,
        conflicting_booking: otherBooking,
      });
      roomConflictingBookingsMap.set(otherBooking.id, otherBooking);
    }
  }

  const roomConflictingBookings = Array.from(roomConflictingBookingsMap.values());

  return (
    <BookingDetailClient
      booking={booking}
      displayName={displayName}
      mealJobs={mealJobs}
      rooms={rooms}
      allRooms={(allRooms as any) ?? []}
      allSpaces={(allSpaces as unknown as Space[]) ?? []}
      reservations={myReservations}
      conflicts={conflicts}
      conflictingBookings={conflictingBookingsData ?? []}
      roomConflicts={roomConflicts}
      roomConflictingBookings={roomConflictingBookings}
      cateringOptions={cateringOptions}
      roomingGroups={roomingGroups ?? []}
    />
  );
}
