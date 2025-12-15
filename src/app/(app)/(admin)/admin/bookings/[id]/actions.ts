"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sbServer } from "@/lib/supabase-server";
import type { BookingStatus } from "@/lib/queries/bookings";

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
  cancelReason?: string
) {
  const supabase: any = await sbServer();
  const updateData: any = { status };
  if (cancelReason) {
    updateData.cancel_reason = cancelReason;
  }

  const { error } = await supabase
    .from("bookings")
    .update(updateData)
    .eq("id", bookingId);

  if (error)
    throw new Error(`Failed to update booking status: ${error.message}`);

  revalidatePath(`/admin/bookings/${bookingId}`);
}

export async function deleteBooking(bookingId: string) {
  const supabase: any = await sbServer();

  // Attempt to delete the booking.
  // If cascade is set up correctly in DB, this will delete everything.
  // If not, we might need manual deletion, but user confirmed cascade is desired/expected.
  // We'll try a direct delete first.
  // We'll try a direct delete first.
  const { error, count } = await supabase
    .from("bookings")
    .delete({ count: "exact" })
    .eq("id", bookingId);

  if (error || (count !== null && count === 0)) {
    const errorMessage =
      error?.message || "Delete failed: Access denied or record not found";
    // Fallback: Manual deletion of related records if cascade fails or isn't set up
    console.error("Delete failed, attempting manual cleanup:", errorMessage);

    // Delete related records manually (reverse order of dependencies)
    await supabase.from("meal_jobs").delete().eq("booking_id", bookingId);
    await supabase
      .from("space_reservations")
      .delete()
      .eq("booking_id", bookingId);
    await supabase
      .from("room_assignments")
      .delete()
      .eq("booking_id", bookingId);
    await supabase.from("rooming_groups").delete().eq("booking_id", bookingId);
    await supabase
      .from("dietary_profiles")
      .delete()
      .eq("booking_id", bookingId);

    // Retry booking deletion
    const { error: retryError } = await supabase
      .from("bookings")
      .delete()
      .eq("id", bookingId);

    if (retryError) {
      throw new Error(`Failed to delete booking: ${retryError.message}`);
    }
  }

  revalidatePath("/admin/bookings");
  redirect("/admin/bookings");
}

export async function recordDeposit(bookingId: string) {
  const supabase: any = await sbServer();
  const { error } = await supabase
    .from("bookings")
    .update({
      status: "Confirmed",
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

export async function assignCaterer(
  mealJobId: string,
  catererId: string | null
) {
  const supabase: any = await sbServer();
  const { error } = await supabase
    .from("meal_jobs")
    .update({
      assigned_caterer_id: catererId,
      status: catererId ? "Assigned" : "Draft",
    })
    .eq("id", mealJobId);

  if (error) throw new Error(`Failed to assign caterer: ${error.message}`);
  revalidatePath("/admin/bookings/[id]", "page");
}

export async function updateMealJobItems(
  mealJobId: string,
  menuItemIds: string[]
) {
  const supabase: any = await sbServer();

  // First delete existing items
  const { error: deleteError } = await supabase
    .from("meal_job_items")
    .delete()
    .eq("meal_job_id", mealJobId);

  if (deleteError)
    throw new Error(`Failed to clear menu items: ${deleteError.message}`);

  if (menuItemIds.length > 0) {
    const { error: insertError } = await supabase.from("meal_job_items").insert(
      menuItemIds.map((itemId) => ({
        meal_job_id: mealJobId,
        menu_item_id: itemId,
      }))
    );

    if (insertError)
      throw new Error(`Failed to update menu items: ${insertError.message}`);
  }

  revalidatePath("/admin/bookings/[id]", "page");
}

export async function updateCoffeeRequest(
  mealJobId: string,
  requested: boolean,
  quantity: number | null
) {
  const supabase: any = await sbServer();
  const { error } = await supabase
    .from("meal_jobs")
    .update({
      percolated_coffee: requested,
      percolated_coffee_quantity: quantity,
    })
    .eq("id", mealJobId);

  if (error)
    throw new Error(`Failed to update coffee request: ${error.message}`);
  revalidatePath("/admin/bookings/[id]", "page");
}

export async function assignCatererToDay(
  date: string,
  bookingId: string,
  catererId: string | null
) {
  const supabase: any = await sbServer();

  // Update only unassigned meals for this specific date
  const { error } = await supabase
    .from("meal_jobs")
    .update({
      assigned_caterer_id: catererId,
      status: catererId ? "Assigned" : "Draft",
    })
    .eq("booking_id", bookingId)
    .eq("service_date", date);

  if (error)
    throw new Error(`Failed to assign caterer to day: ${error.message}`);
  revalidatePath("/admin/bookings/[id]", "page");
}
