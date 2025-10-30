import { notFound } from "next/navigation";

import { BookingDetailClient } from "./_components/booking-detail-client";
import {
  getAssignedMealJobs,
  getBookingsForAdmin,
  getRoomsForBooking,
} from "@/lib/queries/bookings";
import { enrichMealJobs } from "@/lib/catering";
import { toBookingSummary, toRoomSummaries } from "@/lib/mappers";

export default async function BookingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const bookings = await getBookingsForAdmin();
  const bookingRow = bookings.find((entry) => entry.id === params.id);
  if (!bookingRow) {
    notFound();
  }

  const booking = toBookingSummary(bookingRow);
  const mealJobs = await getAssignedMealJobs({ bookingId: params.id });
  const enrichedJobs = enrichMealJobs(mealJobs);
  const roomAssignments = await getRoomsForBooking(params.id);
  const rooms = toRoomSummaries(roomAssignments);

  return <BookingDetailClient booking={booking} mealJobs={enrichedJobs} rooms={rooms} />;
}
