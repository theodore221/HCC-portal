import { notFound } from "next/navigation";
import { sbServer } from "@/lib/supabase-server";

import { enrichMealJobs } from "@/lib/catering";
import { getBookingDisplayName } from "@/lib/queries/bookings";
import {
  getBookingsForAdmin,
  getMealJobsForBooking,
  getRoomsForBooking,
} from "@/lib/queries/bookings.server";
import { getCateringOptions } from "@/lib/queries/catering.server";
import BookingDetailClient from "./client";

import type { Space, SpaceReservation } from "@/lib/queries/bookings";
import type { Views } from "@/lib/database.types";

export default async function BookingDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bookings = await getBookingsForAdmin();
  const booking = bookings.find((b) => b.id === id);
  if (!booking) return notFound();

  const mealJobsRaw = await getMealJobsForBooking(booking.id);
  const rooms = await getRoomsForBooking(booking.id);
  const cateringOptions = await getCateringOptions();
  const mealJobs = enrichMealJobs(mealJobsRaw, [booking]);
  const displayName = getBookingDisplayName(booking);

  const supabase: any = await sbServer();

  // 1. Fetch all necessary data
  const [
    { data: allSpaces },
    { data: bookingReservations },
    { data: potentialConflictingReservations },
    { data: roomingGroups },
  ] = await Promise.all([
    supabase
      .from("spaces")
      .select("id, name, capacity")
      .eq("active", true)
      .order("name"),
    supabase
      .from("space_reservations")
      .select("*")
      .eq("booking_id", booking.id),
    supabase
      .from("space_reservations")
      .select("*, booking:bookings(status)")
      .gte("service_date", booking.arrival_date)
      .lte("service_date", booking.departure_date)
      .neq("booking_id", booking.id), // Exclude current booking
    supabase.from("rooming_groups").select("*").eq("booking_id", booking.id),
  ]);

  // 2. Compute Conflicts in App Layer
  const conflicts: Views<"v_space_conflicts">[] = [];
  const myReservations = (bookingReservations as SpaceReservation[]) ?? [];
  const othersReservations =
    (potentialConflictingReservations as (SpaceReservation & {
      booking: { status: string } | null;
    })[]) ?? [];

  for (const myRes of myReservations) {
    for (const otherRes of othersReservations) {
      // Must be same space and same day
      if (
        myRes.space_id !== otherRes.space_id ||
        myRes.service_date !== otherRes.service_date
      ) {
        continue;
      }

      // Check time overlap
      // If times are null, assume full day (00:00 - 23:59)
      const myStart = myRes.start_time ?? "00:00";
      const myEnd = myRes.end_time ?? "23:59";
      const otherStart = otherRes.start_time ?? "00:00";
      const otherEnd = otherRes.end_time ?? "23:59";

      if (myStart < otherEnd && otherStart < myEnd) {
        // Priority Logic:
        // If I am Confirmed/Approved, I only care about other Confirmed/Approved bookings.
        // If I am Pending, I care about EVERYONE.

        const myStatus = booking.status;
        const otherStatus = otherRes.booking?.status;

        const iAmPriority =
          myStatus === "Confirmed" ||
          myStatus === "Approved" ||
          myStatus === "DepositReceived"; // Treat DepositReceived as high priority too just in case
        const otherIsPending = otherStatus === "Pending";

        if (iAmPriority && otherIsPending) {
          // Ignore this conflict
          continue;
        }

        conflicts.push({
          booking_id: booking.id,
          space_id: myRes.space_id,
          service_date: myRes.service_date,
          conflicts_with: otherRes.booking_id,
        });
      }
    }
  }

  // 3. Fetch details for conflicting bookings
  const conflictingBookingIds = Array.from(
    new Set(conflicts.map((c) => c.conflicts_with).filter(Boolean) as string[])
  );

  let conflictingBookingsData: any[] = [];

  if (conflictingBookingIds.length > 0) {
    const { data } = await supabase
      .from("bookings")
      .select("id, reference, status, contact_name, customer_name")
      .in("id", conflictingBookingIds);
    if (data) {
      conflictingBookingsData = data;
    }
  }

  return (
    <BookingDetailClient
      booking={booking}
      displayName={displayName}
      mealJobs={mealJobs}
      rooms={rooms}
      allSpaces={(allSpaces as unknown as Space[]) ?? []}
      reservations={myReservations}
      conflicts={conflicts}
      conflictingBookings={conflictingBookingsData ?? []}
      cateringOptions={cateringOptions}
      roomingGroups={roomingGroups ?? []}
    />
  );
}
