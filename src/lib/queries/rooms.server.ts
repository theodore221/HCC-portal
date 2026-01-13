import { sbServer } from "@/lib/supabase-server";
import type { Tables } from "@/lib/database.types";

export type RoomStatus =
  | "ready"
  | "needs_setup"
  | "setup_complete"
  | "in_use"
  | "cleaning_required";

export interface RoomWithStatus extends Tables<"rooms"> {
  room_types: Tables<"room_types"> | null;
  level: string | null;
  room_number: string | null;
  wing: string | null;
  status: RoomStatus;
  occupantCount: number;
  guestNames: string[];
  byoLinen: boolean;
  extraBedSelected: boolean;
  ensuiteSelected: boolean;
  privateStudySelected: boolean;
  relatedBookingId: string | null;
  relatedBookingName: string | null;
}

/**
 * Get room status for a specific date
 * Computes status based on:
 * - IN_USE: arrival_date <= date < departure_date
 * - CLEANING_REQUIRED: departure_date == date AND not marked cleaned
 * - NEEDS_SETUP: arrival_date == date+1 AND not marked setup_complete
 * - READY: default (no booking activity or actions completed)
 */
export async function getRoomStatusForDate(
  date: string
): Promise<RoomWithStatus[]> {
  const supabase = await sbServer();

  // Calculate dates for status logic (avoid timezone issues)
  const [year, month, day] = date.split("-").map(Number);
  const selectedDate = new Date(year, month - 1, day);

  const nextDay = new Date(selectedDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const nextDayStr = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, "0")}-${String(nextDay.getDate()).padStart(2, "0")}`;

  console.log("=== Room Status Query Debug ===");
  console.log("Selected date:", date);
  console.log("Next day:", nextDayStr);

  // Fetch all active rooms with room types
  const { data: rooms, error: roomsError } = await supabase
    .from("rooms")
    .select(
      `
      *,
      room_types (*)
    `
    )
    .eq("active", true)
    .order("room_number");

  if (roomsError) {
    throw new Error(`Failed to load rooms: ${roomsError.message}`);
  }

  // Fetch room assignments with booking details
  // We need: arrivals tomorrow (needs_setup), current stays (in_use), departures today (cleaning_required)
  const { data: assignments, error: assignmentsError } = await supabase.from(
    "room_assignments"
  ).select(`
      *,
      bookings (
        id,
        arrival_date,
        departure_date,
        customer_name,
        contact_name,
        status,
        accommodation_requests
      )
    `);

  if (assignmentsError) {
    console.error("Failed to load assignments:", assignmentsError);
    throw new Error(`Failed to load assignments: ${assignmentsError.message}`);
  }

  // Fetch status logs for this date
  const { data: statusLogs, error: logsError } = await (
    supabase.from("room_status_logs") as any
  )
    .select("room_id, action_type")
    .eq("action_date", date);

  if (logsError) {
    throw new Error(`Failed to load status logs: ${logsError.message}`);
  }

  console.log("Total assignments found:", assignments?.length ?? 0);
  console.log("Total rooms found:", rooms?.length ?? 0);
  console.log("Status logs found:", statusLogs?.length ?? 0);

  // Create lookup maps
  const cleanedRooms = new Set(
    statusLogs
      ?.filter((l) => l.action_type === "cleaned")
      .map((l) => l.room_id) ?? []
  );
  const setupCompleteRooms = new Set(
    statusLogs
      ?.filter((l) => l.action_type === "setup_complete")
      .map((l) => l.room_id) ?? []
  );

  // Compute status for each room
  return (rooms ?? []).map((room) => {
    const roomAssignments = (assignments ?? []).filter((a) => {
      const booking = Array.isArray(a.bookings) ? a.bookings[0] : a.bookings;
      return a.room_id === room.id && booking && booking.status !== "Cancelled";
    });

    let status: RoomStatus = "ready";
    let occupantCount = 0;
    let guestNames: string[] = [];
    let byoLinen = false;
    let extraBedSelected = false;
    let ensuiteSelected = false;
    let privateStudySelected = false;
    let relatedBookingId: string | null = null;
    let relatedBookingName: string | null = null;

    for (const assignment of roomAssignments) {
      const booking = Array.isArray(assignment.bookings)
        ? assignment.bookings[0]
        : assignment.bookings;
      if (!booking) continue;

      const arrivalDate = booking.arrival_date;
      const departureDate = booking.departure_date;

      // Debug logging for rooms with assignments
      if (roomAssignments.length > 0 && room.room_number) {
        console.log(
          `Room ${room.room_number}: arrival=${arrivalDate}, departure=${departureDate}, date=${date}, nextDay=${nextDayStr}`
        );
      }

      // Extract BYO linen info from accommodation_requests
      const accommodationRequests = booking.accommodation_requests as Record<
        string,
        any
      > | null;
      if (accommodationRequests?.byo_linen === true) {
        byoLinen = true;
      }

      // Check if in use (arrival <= date < departure)
      if (arrivalDate <= date && date < departureDate) {
        status = "in_use";
        const assignmentGuestNames = (assignment as any).guest_names;
        guestNames = Array.isArray(assignmentGuestNames)
          ? assignmentGuestNames
          : [];
        occupantCount = guestNames.filter((n) => n && n.trim()).length || 1;
        extraBedSelected = (assignment as any).extra_bed_selected || false;
        ensuiteSelected = (assignment as any).ensuite_selected || false;
        privateStudySelected =
          (assignment as any).private_study_selected || false;
        relatedBookingId = booking.id;
        relatedBookingName =
          booking.customer_name || booking.contact_name || "Guest";
        console.log(`Room ${room.room_number}: Status = IN_USE`);
        break; // in_use takes priority
      }

      // Check if departure day (cleaning required unless marked cleaned)
      if (departureDate === date && !cleanedRooms.has(room.id)) {
        status = "cleaning_required";
        relatedBookingId = booking.id;
        relatedBookingName =
          booking.customer_name || booking.contact_name || "Guest";
        console.log(`Room ${room.room_number}: Status = CLEANING_REQUIRED`);
        // Continue checking - may find a same-day arrival
      }

      // Check if needs setup (arrival is tomorrow, and not already marked setup)
      const isArrivalTomorrow = arrivalDate === nextDayStr;
      const isAlreadySetup = setupCompleteRooms.has(room.id);

      if (roomAssignments.length > 0 && room.room_number) {
        console.log(
          `Room ${room.room_number}: Checking needs_setup - arrivalDate="${arrivalDate}", nextDayStr="${nextDayStr}", match=${isArrivalTomorrow}, alreadySetup=${isAlreadySetup}, currentStatus="${status}"`
        );
      }

      if (isArrivalTomorrow) {
        const assignmentGuestNames = (assignment as any).guest_names;
        guestNames = Array.isArray(assignmentGuestNames)
          ? assignmentGuestNames
          : [];
        const capacity = (room as any).room_types?.capacity ?? 1;
        occupantCount =
          guestNames.filter((n) => n && n.trim()).length || capacity;
        extraBedSelected = (assignment as any).extra_bed_selected || false;
        ensuiteSelected = (assignment as any).ensuite_selected || false;
        privateStudySelected =
          (assignment as any).private_study_selected || false;
        relatedBookingId = booking.id;
        relatedBookingName =
          booking.customer_name || booking.contact_name || "Guest";

        if (isAlreadySetup) {
          // Room is setup and ready for arrival tomorrow
          if (status !== "cleaning_required") {
            status = "setup_complete";
            console.log(
              `✓ Room ${room.room_number}: Status = SETUP_COMPLETE (ready for arrival)`
            );
          }
        } else if (status !== "cleaning_required") {
          // Cleaning takes priority
          status = "needs_setup";
          console.log(`✓ Room ${room.room_number}: Status = NEEDS_SETUP`);
        } else {
          console.log(
            `✗ Room ${room.room_number}: Would be NEEDS_SETUP but CLEANING_REQUIRED takes priority`
          );
        }
      }
    }

    return {
      ...room,
      room_types: (room as any).room_types || null,
      level: (room as any).level || null,
      room_number: (room as any).room_number || null,
      wing: (room as any).wing || null,
      status,
      occupantCount,
      guestNames,
      byoLinen,
      extraBedSelected,
      ensuiteSelected,
      privateStudySelected,
      relatedBookingId,
      relatedBookingName,
    };
  });
}
