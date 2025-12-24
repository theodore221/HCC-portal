import { notFound } from "next/navigation";
import { sbServer } from "@/lib/supabase-server";
import {
  getBookingByReference,
  getMealJobsForBooking,
  getRoomsForBooking,
  getDietaryProfilesForBooking,
} from "@/lib/queries/bookings.server";
import { getCateringOptions } from "@/lib/queries/catering.server";
import { enrichMealJobs } from "@/lib/catering";
import CustomerPortalClient from "./client";
import { getDietaryMealAttendance } from "./actions";

export default async function CustomerPortal({
  params,
}: {
  params: Promise<{ bookingRef: string }>;
}) {
  const { bookingRef } = await params;
  const booking = await getBookingByReference(bookingRef);
  if (!booking) return notFound();

  const supabase = await sbServer();

  const [
    mealJobsRaw,
    rooms,
    dietaryProfiles,
    cateringOptions,
    { data: bookingReservations },
    { data: spaces },
  ] = await Promise.all([
    getMealJobsForBooking(booking.id),
    getRoomsForBooking(booking.id),
    getDietaryProfilesForBooking(booking.id),
    getCateringOptions(),
    supabase
      .from("space_reservations")
      .select("*")
      .eq("booking_id", booking.id),
    supabase.from("spaces").select("id, name, capacity").eq("active", true),
  ]);

  const reservations = (bookingReservations as any[]) || [];
  const allSpaces = (spaces as any[]) || [];

  // Fetch meal attendance data
  const mealAttendance = await getDietaryMealAttendance(booking.id);
  const cateringJobs = enrichMealJobs(mealJobsRaw, [booking]);

  return (
    <CustomerPortalClient
      booking={booking}
      cateringJobs={cateringJobs}
      menuItems={cateringOptions.menuItems}
      dietaryProfiles={dietaryProfiles}
      mealAttendance={mealAttendance}
      rooms={rooms}
      reservations={reservations}
      allSpaces={allSpaces}
    />
  );
}
