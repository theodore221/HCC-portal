"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { sbServer } from "@/lib/supabase-server";
import type { BookingStatus } from "@/lib/queries/bookings";

import { ensureCustomerProfile } from "@/lib/auth/admin-actions";
import { sendBookingApprovedEmail } from "@/lib/email/send-booking-approved";
import { enrichMealJobs } from "@/lib/catering";
import {
  CACHE_TAGS,
  getBookingCacheTags,
  getMealJobCacheTags,
  getSpaceReservationCacheTags,
  getRoomAssignmentCacheTags,
  getDietaryProfileCacheTags,
} from "@/lib/cache";

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
    // Fetch full booking details for email
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("*")
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
      throw new Error("Failed to create/link customer profile. See logs.");
    }

    // Update booking status first
    const { error: updateError } = await supabase
      .from("bookings")
      .update(updateData)
      .eq("id", bookingId);

    if (updateError) {
      throw new Error(`Failed to update booking status: ${updateError.message}`);
    }

    // Send approval email
    try {
      // Fetch related data for email
      const { data: reservations } = await supabase
        .from("space_reservations")
        .select("space_id, spaces(name)")
        .eq("booking_id", bookingId);

      const spaces: string[] = reservations
        ? Array.from(new Set(reservations.map((r: any) => r.spaces?.name).filter(Boolean))) as string[]
        : [];

      // Fetch meal jobs for catering summary
      const { data: mealJobsData } = await supabase
        .from("meal_jobs")
        .select(`
          *,
          meal_job_items(menu_item_id, menu_items(id, label, caterer_id)),
          caterers(id, name)
        `)
        .eq("booking_id", bookingId);

      const mealJobs = mealJobsData || [];
      const enrichedMeals = enrichMealJobs(mealJobs, [booking]);

      // Calculate accommodation summary
      const accommodationRequests = (booking.accommodation_requests as Record<string, number | boolean>) || {};
      const accommodationSummary = booking.is_overnight ? {
        doubleBB: (accommodationRequests.doubleBB as number) || 0,
        singleBB: (accommodationRequests.singleBB as number) || 0,
        studySuite: (accommodationRequests.studySuite as number) || 0,
        doubleEnsuite: (accommodationRequests.doubleEnsuite as number) || 0,
      } : undefined;

      // Calculate catering summary
      const cateringSummary = booking.catering_required ? {
        totalMeals: enrichedMeals.length
      } : undefined;

      await sendBookingApprovedEmail({
        booking,
        spaces,
        accommodationSummary,
        cateringSummary,
      });

      console.log(`Booking approval email sent for booking ${bookingId}`);
    } catch (emailError) {
      // Log email error but don't fail the approval
      console.error("Failed to send booking approval email:", emailError);
      // Approval succeeded even if email failed
    }

    revalidatePath(`/admin/bookings/${bookingId}`);
    // Invalidate caches
    getBookingCacheTags(bookingId).forEach(tag => revalidateTag(tag));
    return;
  }

  // For non-approval status changes, just update
  const { error } = await supabase
    .from("bookings")
    .update(updateData)
    .eq("id", bookingId);

  if (error)
    throw new Error(`Failed to update booking status: ${error.message}`);

  revalidatePath(`/admin/bookings/${bookingId}`);
  // Invalidate caches
  getBookingCacheTags(bookingId).forEach(tag => revalidateTag(tag));
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
  // Invalidate all booking-related caches
  revalidateTag(CACHE_TAGS.BOOKINGS);
  revalidateTag(CACHE_TAGS.BOOKING_STATUS_COUNTS);
  redirect("/admin/bookings");
}

export async function recordDeposit(bookingId: string, depositReference?: string) {
  const supabase: any = await sbServer();
  const { error } = await supabase
    .from("bookings")
    .update({
      status: "Confirmed",
      deposit_status: "Paid",
      deposit_received_at: new Date().toISOString(),
      deposit_reference: depositReference || null,
    })
    .eq("id", bookingId);

  if (error) throw new Error(`Failed to record deposit: ${error.message}`);

  revalidatePath(`/admin/bookings/${bookingId}`);
  getBookingCacheTags(bookingId).forEach(tag => revalidateTag(tag));
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
  revalidateTag(CACHE_TAGS.SPACE_RESERVATIONS);
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
  revalidateTag(CACHE_TAGS.MEAL_JOBS);
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
  revalidateTag(CACHE_TAGS.MEAL_JOBS);
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
  getRoomAssignmentCacheTags(bookingId).forEach(tag => revalidateTag(tag));
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
  getRoomAssignmentCacheTags(bookingId).forEach(tag => revalidateTag(tag));
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
  const { data: updated, error } = await supabase
    .from("room_assignments")
    .update({
      guest_names: data.guestNames,
      extra_bed_selected: data.extraBed,
      ensuite_selected: data.ensuite,
      private_study_selected: data.privateStudy,
    })
    .eq("id", assignment.id)
    .select(
      "guest_names, extra_bed_selected, ensuite_selected, private_study_selected"
    )
    .single();

  if (error) {
    throw new Error(`Failed to update room allocation: ${error.message}`);
  }

  revalidatePath(`/admin/bookings/${bookingId}`);
  return updated;
}

export async function updateAccommodationRequests(
  bookingId: string,
  accommodationRequests: {
    doubleBB: number;
    singleBB: number;
    studySuite: number;
    doubleEnsuite: number;
    byo_linen: boolean;
  }
) {
  const supabase: any = await sbServer();

  const { error } = await supabase
    .from("bookings")
    .update({
      accommodation_requests: accommodationRequests,
    })
    .eq("id", bookingId);

  if (error) {
    throw new Error(`Failed to update accommodation requests: ${error.message}`);
  }

  revalidatePath(`/admin/bookings/${bookingId}`);
}

// ==================== Catering Actions ====================

export async function updateMealJobServes(
  mealJobId: string,
  countsTotal: number
) {
  const supabase: any = await sbServer();
  const { error } = await supabase
    .from("meal_jobs")
    .update({ counts_total: countsTotal })
    .eq("id", mealJobId);

  if (error) {
    throw new Error(`Failed to update meal serves: ${error.message}`);
  }

  revalidatePath("/admin/bookings/[id]", "page");
}

// ==================== Dietary Profile Actions ====================

export async function createDietaryProfile(
  bookingId: string,
  data: {
    personName: string;
    dietType: string;
    allergy?: string;
    severity?: "Low" | "Moderate" | "High" | "Fatal";
    notes?: string;
  }
) {
  const supabase: any = await sbServer();

  const { data: profile, error } = await supabase
    .from("dietary_profiles")
    .insert({
      booking_id: bookingId,
      person_name: data.personName,
      diet_type: data.dietType,
      allergy: data.allergy || null,
      severity: data.severity || null,
      notes: data.notes || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create dietary profile: ${error.message}`);
  }

  revalidatePath("/admin/bookings/[id]", "page");
  revalidateTag(CACHE_TAGS.DIETARY_PROFILES);
  return profile;
}

export async function updateDietaryProfile(
  profileId: string,
  data: {
    personName?: string;
    dietType?: string;
    allergy?: string | null;
    severity?: "Low" | "Moderate" | "High" | "Fatal" | null;
    notes?: string | null;
  }
) {
  const supabase: any = await sbServer();

  const updateData: any = {};
  if (data.personName !== undefined) updateData.person_name = data.personName;
  if (data.dietType !== undefined) updateData.diet_type = data.dietType;
  if (data.allergy !== undefined) updateData.allergy = data.allergy;
  if (data.severity !== undefined) updateData.severity = data.severity;
  if (data.notes !== undefined) updateData.notes = data.notes;

  const { data: profile, error } = await supabase
    .from("dietary_profiles")
    .update(updateData)
    .eq("id", profileId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update dietary profile: ${error.message}`);
  }

  revalidatePath("/admin/bookings/[id]", "page");
  revalidateTag(CACHE_TAGS.DIETARY_PROFILES);
  return profile;
}

export async function deleteDietaryProfile(profileId: string) {
  const supabase: any = await sbServer();

  const { error } = await supabase
    .from("dietary_profiles")
    .delete()
    .eq("id", profileId);

  if (error) {
    throw new Error(`Failed to delete dietary profile: ${error.message}`);
  }

  revalidatePath("/admin/bookings/[id]", "page");
  revalidateTag(CACHE_TAGS.DIETARY_PROFILES);
}

// ==================== Dietary Meal Attendance Actions ====================

export async function updateDietaryMealAttendance(
  dietaryProfileId: string,
  mealJobId: string,
  attending: boolean
) {
  const supabase: any = await sbServer();

  // Upsert - insert if not exists, update if exists
  const { error } = await supabase
    .from("dietary_meal_attendance")
    .upsert(
      {
        dietary_profile_id: dietaryProfileId,
        meal_job_id: mealJobId,
        attending,
      },
      {
        onConflict: "dietary_profile_id,meal_job_id",
      }
    );

  if (error) {
    throw new Error(`Failed to update meal attendance: ${error.message}`);
  }

  revalidatePath("/admin/bookings/[id]", "page");
}

export async function getDietaryMealAttendance(bookingId: string) {
  const supabase: any = await sbServer();

  // Get all dietary profiles for this booking
  const { data: profiles, error: profilesError } = await supabase
    .from("dietary_profiles")
    .select("id")
    .eq("booking_id", bookingId);

  if (profilesError) {
    throw new Error(`Failed to get dietary profiles: ${profilesError.message}`);
  }

  if (!profiles || profiles.length === 0) {
    return {};
  }

  const profileIds = profiles.map((p: any) => p.id);

  // Get all attendance records for these profiles
  const { data: attendance, error: attendanceError } = await supabase
    .from("dietary_meal_attendance")
    .select("dietary_profile_id, meal_job_id, attending")
    .in("dietary_profile_id", profileIds);

  if (attendanceError) {
    throw new Error(`Failed to get meal attendance: ${attendanceError.message}`);
  }

  // Convert to nested Record structure
  const result: Record<string, Record<string, boolean>> = {};
  for (const record of attendance || []) {
    if (!result[record.dietary_profile_id]) {
      result[record.dietary_profile_id] = {};
    }
    result[record.dietary_profile_id][record.meal_job_id] = record.attending;
  }

  return result;
}

// ==================== Booking Detail Edit Actions ====================

export async function updatePrimaryContact(
  bookingId: string,
  data: {
    contact_name: string | null;
    contact_phone: string | null;
    customer_email: string;
  }
) {
  const supabase: any = await sbServer();
  const { error } = await supabase
    .from("bookings")
    .update({
      contact_name: data.contact_name,
      contact_phone: data.contact_phone,
      customer_email: data.customer_email,
    })
    .eq("id", bookingId);

  if (error) throw new Error(`Failed to update primary contact: ${error.message}`);
  revalidatePath(`/admin/bookings/${bookingId}`);
}

export async function updateBookingSpecifics(
  bookingId: string,
  data: {
    booking_type: "Group" | "Individual";
    headcount: number;
    catering_required: boolean;
    arrival_date: string;
    departure_date: string;
    arrival_time: string | null;
    departure_time: string | null;
  }
) {
  const supabase: any = await sbServer();

  const { error } = await supabase
    .from("bookings")
    .update({
      booking_type: data.booking_type,
      headcount: data.headcount,
      catering_required: data.catering_required,
      arrival_date: data.arrival_date,
      departure_date: data.departure_date,
      arrival_time: data.arrival_time,
      departure_time: data.departure_time,
    })
    .eq("id", bookingId);

  if (error) throw new Error(`Failed to update booking specifics: ${error.message}`);
  revalidatePath(`/admin/bookings/${bookingId}`);
}
