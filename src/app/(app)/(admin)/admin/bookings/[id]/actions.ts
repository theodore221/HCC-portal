"use server";

import { revalidatePath } from "next/cache";
import { sbServer } from "@/lib/supabase-server";
import type { BookingStatus } from "@/lib/queries/bookings";

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus
) {
  const supabase: any = await sbServer();
  const { error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", bookingId);

  if (error)
    throw new Error(`Failed to update booking status: ${error.message}`);

  revalidatePath(`/admin/bookings/${bookingId}`);
}

export async function recordDeposit(bookingId: string) {
  const supabase: any = await sbServer();
  const { error } = await supabase
    .from("bookings")
    .update({
      deposit_status: "Paid",
      deposit_received_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  if (error) throw new Error(`Failed to record deposit: ${error.message}`);

  revalidatePath(`/admin/bookings/${bookingId}`);
}

export async function updateSpaceReservation(
  reservationId: string,
  newSpaceId: string
) {
  const supabase: any = await sbServer();
  const { error } = await supabase
    .from("space_reservations" as any)
    .update({ space_id: newSpaceId })
    .eq("id", reservationId);

  if (error)
    throw new Error(`Failed to update space reservation: ${error.message}`);

  revalidatePath("/admin/bookings/[id]", "page");
}
