import { notFound } from "next/navigation";
import { sbServer } from "@/lib/supabase-server";
import {
  getBookingByReference,
  getMealJobsForBooking,
  getRoomsForBooking,
  getDietaryProfilesForBooking,
} from "@/lib/queries/bookings.server";
import { enrichMealJobs } from "@/lib/catering";
import CustomerPortalClient from "./client";

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
    { data: roomingGroups },
    { data: roomTypes },
    { data: guests },
  ] = await Promise.all([
    getMealJobsForBooking(booking.id),
    getRoomsForBooking(booking.id),
    getDietaryProfilesForBooking(booking.id),
    supabase.from("rooming_groups").select("*").eq("booking_id", booking.id),
    supabase.from("room_types").select("id, name"),
    supabase
      .from("guests")
      .select("*")
      .eq("booking_id", booking.id)
      .order("created_at", { ascending: true }),
  ]);

  const safeRoomingGroups = (roomingGroups as any[]) || [];
  const safeGuests = (guests as any[]) || [];

  // Filter out guests that are already assigned to a group
  const assignedGuestIds =
    safeRoomingGroups.flatMap((g) => g.members || []) || [];

  // Map DB guests to the format expected by UI
  // If a guest is assigned, we don't pass them as "unassigned"
  const unassignedGuests = safeGuests
    .filter((g) => !assignedGuestIds.includes(g.id))
    .map((g) => ({ id: g.id, name: g.full_name }));

  const allGuests = safeGuests.map((g) => ({ id: g.id, name: g.full_name }));
  const cateringJobs = enrichMealJobs(mealJobsRaw, [booking]);

  return (
    <CustomerPortalClient
      booking={booking}
      cateringJobs={cateringJobs}
      dietaryProfiles={dietaryProfiles}
      roomingGroups={safeRoomingGroups}
      unassignedGuests={unassignedGuests}
      allGuests={allGuests}
      roomTypes={roomTypes ?? []}
    />
  );
}
