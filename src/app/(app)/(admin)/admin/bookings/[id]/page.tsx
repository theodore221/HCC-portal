import { notFound } from "next/navigation";
import { sbServer } from "@/lib/supabase-server";

import { enrichMealJobs } from "@/lib/catering";
import { getBookingDisplayName } from "@/lib/queries/bookings";
import {
  getBookingsForAdmin,
  getMealJobsForBooking,
  getRoomsForBooking,
} from "@/lib/queries/bookings.server";
import BookingDetailClient from "./client";

import type { Space, SpaceReservation } from "@/lib/queries/bookings";
import type { Views } from "@/lib/database.types";

export default async function BookingDetail({
  params,
}: {
  params: { id: string };
}) {
  const bookings = await getBookingsForAdmin();
  const booking = bookings.find((b) => b.id === params.id);
  if (!booking) return notFound();

  const mealJobsRaw = await getMealJobsForBooking(booking.id);
  const rooms = await getRoomsForBooking(booking.id);
  const mealJobs = enrichMealJobs(mealJobsRaw, [booking]);
  const displayName = getBookingDisplayName(booking);

  const supabase: any = await sbServer();
  const [{ data: allSpaces }, { data: reservations }, { data: conflicts }] =
    await Promise.all([
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
        .from("v_space_conflicts")
        .select("*")
        .eq("booking_id", booking.id),
    ]);

  const typedConflicts =
    (conflicts as unknown as Views<"v_space_conflicts">[]) ?? [];

  // Fetch details for conflicting bookings
  const conflictingBookingIds = Array.from(
    new Set(
      typedConflicts.map((c) => c.conflicts_with).filter(Boolean) as string[]
    )
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

  // Force recompile
  console.log("Conflicting bookings data:", conflictingBookingsData);

  return (
    <BookingDetailClient
      booking={booking}
      displayName={displayName}
      mealJobs={mealJobs}
      rooms={rooms}
      allSpaces={(allSpaces as unknown as Space[]) ?? []}
      reservations={(reservations as unknown as SpaceReservation[]) ?? []}
      conflicts={typedConflicts}
      conflictingBookings={conflictingBookingsData ?? []}
    />
  );
}
