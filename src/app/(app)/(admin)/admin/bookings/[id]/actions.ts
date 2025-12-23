"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sbServer } from "@/lib/supabase-server";
import type { BookingStatus } from "@/lib/queries/bookings";

import { ensureCustomerProfile } from "@/lib/auth/admin-actions";

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

  // If approving, ensure customer profile exists and link it
  if (status === "Approved") {
    // Fetch booking details to get email and name
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("customer_email, customer_name")
      .eq("id", bookingId)
      .single();

    if (fetchError || !booking) {
      throw new Error("Failed to fetch booking details for approval");
    }

    try {
      const customerUserId = await ensureCustomerProfile(
        booking.customer_email,
        booking.customer_name || "Customer"
      );
      updateData.customer_user_id = customerUserId;
    } catch (error) {
      console.error("Failed to ensure customer profile:", error);
      // We might want to throw here, or just proceed without linking (but linking is the goal)
      throw new Error("Failed to create/link customer profile. See logs.");
    }
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

// ==================== Room Allocation Actions ====================

export async function allocateRoom(bookingId: string, roomId: string) {
  const supabase: any = await sbServer();

  // Get booking dates for conflict checking
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("arrival_date, departure_date")
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking) {
    throw new Error("Booking not found");
  }

  // Check if room is already allocated to another booking with overlapping dates
  const { data: existingAssignments } = await supabase
    .from("room_assignments")
    .select(
      "booking_id, booking:bookings(arrival_date, departure_date, status)"
    )
    .eq("room_id", roomId)
    .neq("booking_id", bookingId);

  const hasConflict = (existingAssignments ?? []).some((assignment: any) => {
    const other = assignment.booking;
    if (!other || other.status === "Cancelled") return false;
    // Check date overlap
    return (
      other.arrival_date < booking.departure_date &&
      other.departure_date > booking.arrival_date
    );
  });

  if (hasConflict) {
    throw new Error(
      "Room is already allocated to another booking for overlapping dates"
    );
  }

  // Check if already allocated to this booking
  const { data: existing } = await supabase
    .from("room_assignments")
    .select("id")
    .eq("booking_id", bookingId)
    .eq("room_id", roomId)
    .maybeSingle();

  if (existing) {
    // Already allocated, nothing to do
    return;
  }

  // Create room assignment (room-level only, customer assigns guests later)
  const { error } = await supabase.from("room_assignments").insert({
    booking_id: bookingId,
    room_id: roomId,
    occupant_name: "TBD",
    bed_number: 1,
    is_extra_bed: false,
  });

  if (error) {
    throw new Error(`Failed to allocate room: ${error.message}`);
  }

  revalidatePath(`/admin/bookings/${bookingId}`);
}

export async function deallocateRoom(bookingId: string, roomId: string) {
  const supabase: any = await sbServer();

  const { error } = await supabase
    .from("room_assignments")
    .delete()
    .eq("booking_id", bookingId)
    .eq("room_id", roomId);

  if (error) {
    throw new Error(`Failed to deallocate room: ${error.message}`);
  }

  revalidatePath(`/admin/bookings/${bookingId}`);
}

// Note: activateRoom was removed - we now allow allocating inactive rooms
// directly for a specific booking without permanently activating them.
// This keeps emergency rooms (34, Chapter) locked for other bookings
// while allowing admins to unlock them for specific bookings when needed.

export async function updateRoomAllocationDetails(
  bookingId: string,
  roomId: string,
  data: {
    guestNames: string[];
    extraBed: boolean;
    ensuite: boolean;
    privateStudy: boolean;
  }
) {
  const supabase: any = await sbServer();

  // Find the room assignment
  const { data: assignment, error: findError } = await supabase
    .from("room_assignments")
    .select("id")
    .eq("booking_id", bookingId)
    .eq("room_id", roomId)
    .maybeSingle();

  if (findError) {
    throw new Error(`Failed to find room assignment: ${findError.message}`);
  }

  if (!assignment) {
    throw new Error("Room assignment not found");
  }

  // Update the assignment with guest names and extras
  const { error } = await supabase
    .from("room_assignments")
    .update({
      guest_names: data.guestNames,
      extra_bed_selected: data.extraBed,
      ensuite_selected: data.ensuite,
      private_study_selected: data.privateStudy,
    })
    .eq("id", assignment.id);

  if (error) {
    throw new Error(`Failed to update room allocation: ${error.message}`);
  }

  revalidatePath(`/admin/bookings/${bookingId}`);
}
