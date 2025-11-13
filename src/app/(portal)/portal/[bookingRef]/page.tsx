import { notFound } from "next/navigation";

import { enrichMealJobs } from "@/lib/catering";
import {
  getBookingByReference,
  getDietaryProfilesForBooking,
  getMealJobsForBooking,
  getRoomsForBooking,
} from "@/lib/queries/bookings.server";

import { PortalBookingCard } from "./PortalBookingCard";

export default async function CustomerPortal({
  params,
}: {
  params: { bookingRef: string };
}) {
  const booking = await getBookingByReference(params.bookingRef);
  if (!booking) return notFound();

  const [mealJobsRaw, rooms, dietaryProfiles] = await Promise.all([
    getMealJobsForBooking(booking.id),
    getRoomsForBooking(booking.id),
    getDietaryProfilesForBooking(booking.id),
  ]);
  const cateringJobs = enrichMealJobs(mealJobsRaw, [booking]);

  return (
    <PortalBookingCard
      booking={booking}
      cateringJobs={cateringJobs}
      rooms={rooms}
      dietaryProfiles={dietaryProfiles}
    />
  );
}
