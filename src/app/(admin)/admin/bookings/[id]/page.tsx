import { notFound } from "next/navigation";

import { enrichMealJobs } from "@/lib/catering";
import {
  getBookingsForAdmin,
  getBookingDisplayName,
  getMealJobsForBooking,
  getRoomsForBooking,
} from "@/lib/queries/bookings";
import BookingDetailClient from "./client";

export default async function BookingDetail({ params }: { params: { id: string } }) {
  const bookings = await getBookingsForAdmin();
  const booking = bookings.find((b) => b.id === params.id);
  if (!booking) return notFound();

  const mealJobsRaw = await getMealJobsForBooking(booking.id);
  const rooms = await getRoomsForBooking(booking.id);
  const mealJobs = enrichMealJobs(mealJobsRaw, [booking]);
  const displayName = getBookingDisplayName(booking);

  return (
    <BookingDetailClient
      booking={booking}
      displayName={displayName}
      mealJobs={mealJobs}
      rooms={rooms}
    />
  );
}
