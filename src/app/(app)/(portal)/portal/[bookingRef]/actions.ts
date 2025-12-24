// @ts-nocheck
"use server";

import { revalidatePath } from "next/cache";
import { sbServer } from "@/lib/supabase-server";

export async function createRoomingGroup(bookingId: string) {
  const supabase = await sbServer();

  // Cast to any to bypass type errors with new table
  const { data, error } = await (supabase.from("rooming_groups") as any)
    .insert({
      booking_id: bookingId,
      group_name: "New Group",
      members: [],
      status: "draft",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating rooming group:", error);
    throw new Error("Failed to create rooming group");
  }

  revalidatePath("/portal/[bookingRef]");
  return data;
}

export async function updateRoomingGroup(
  groupId: string,
  updates: {
    group_name?: string;
    members?: string[];
    preferred_room_type?: string | null;
    special_requests?: string | null;
  }
) {
  const supabase = await sbServer();

  const { error } = await (supabase.from("rooming_groups") as any)
    .update(updates)
    .eq("id", groupId);

  if (error) {
    console.error("Error updating rooming group:", error);
    throw new Error("Failed to update rooming group");
  }

  revalidatePath("/portal/[bookingRef]");
}

export async function deleteRoomingGroup(groupId: string) {
  const supabase = await sbServer();

  const { error } = await (supabase.from("rooming_groups") as any)
    .delete()
    .eq("id", groupId);

  if (error) {
    console.error("Error deleting rooming group:", error);
    throw new Error("Failed to delete rooming group");
  }

  revalidatePath("/portal/[bookingRef]");
}

// ==================== Accommodation Actions ====================

export async function customerUpdateAccommodationRequests(
  bookingId: string,
  accommodationRequests: {
    doubleBB: number;
    singleBB: number;
    studySuite: number;
    doubleEnsuite: number;
    byo_linen: boolean;
  }
) {
  const supabase = await sbServer();
  const { error } = await supabase.rpc("customer_update_accommodation_requests", {
    p_booking_id: bookingId,
    p_new_requests: accommodationRequests,
  });

  if (error) {
    throw new Error(`Failed to update accommodation requests: ${error.message}`);
  }

  revalidatePath("/portal/[bookingRef]");
}

export async function customerUpdateRoomAllocationDetails(
  bookingId: string,
  roomId: string,
  data: {
    guestNames: string[];
    extraBed: boolean;
    ensuite: boolean;
    privateStudy: boolean;
  }
) {
  const supabase = await sbServer();
  const { data: updated, error } = await supabase.rpc(
    "customer_update_room_allocation_details",
    {
      p_booking_id: bookingId,
      p_room_id: roomId,
      p_guest_names: data.guestNames,
      p_extra_bed: data.extraBed,
      p_ensuite: data.ensuite,
      p_private_study: data.privateStudy,
    }
  );

  if (error) {
    throw new Error(`Failed to update room allocation: ${error.message}`);
  }

  revalidatePath("/portal/[bookingRef]");
  return updated;
}

// ==================== Catering Actions ====================

export async function customerUpdateMealJobItems(
  mealJobId: string,
  menuItemIds: string[]
) {
  const supabase = await sbServer();

  const { error: deleteError } = await supabase
    .from("meal_job_items")
    .delete()
    .eq("meal_job_id", mealJobId);

  if (deleteError) {
    throw new Error(`Failed to clear menu items: ${deleteError.message}`);
  }

  if (menuItemIds.length > 0) {
    const { error: insertError } = await supabase.from("meal_job_items").insert(
      menuItemIds.map((itemId) => ({
        meal_job_id: mealJobId,
        menu_item_id: itemId,
      }))
    );

    if (insertError) {
      throw new Error(`Failed to update menu items: ${insertError.message}`);
    }
  }

  revalidatePath("/portal/[bookingRef]");
}

export async function customerUpdateCoffeeRequest(
  mealJobId: string,
  requested: boolean,
  quantity: number | null
) {
  const supabase = await sbServer();
  const { error } = await supabase
    .from("meal_jobs")
    .update({
      percolated_coffee: requested,
      percolated_coffee_quantity: quantity,
    })
    .eq("id", mealJobId);

  if (error) {
    throw new Error(`Failed to update coffee request: ${error.message}`);
  }

  revalidatePath("/portal/[bookingRef]");
}

export async function customerUpdateMealJobServes(
  mealJobId: string,
  countsTotal: number
) {
  const supabase = await sbServer();
  const { error } = await supabase
    .from("meal_jobs")
    .update({ counts_total: countsTotal })
    .eq("id", mealJobId);

  if (error) {
    throw new Error(`Failed to update meal serves: ${error.message}`);
  }

  revalidatePath("/portal/[bookingRef]");
}

// ==================== Dietary Profile Actions ====================

export async function customerCreateDietaryProfile(
  bookingId: string,
  data: {
    personName: string;
    dietType: string;
    allergy?: string;
    severity?: "Low" | "Moderate" | "High" | "Fatal";
    notes?: string;
  }
) {
  const supabase = await sbServer();

  const { data: profile, error } = await (supabase.from("dietary_profiles") as any)
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

  revalidatePath("/portal/[bookingRef]");
  return profile;
}

export async function customerUpdateDietaryProfile(
  profileId: string,
  data: {
    personName?: string;
    dietType?: string;
    allergy?: string | null;
    severity?: "Low" | "Moderate" | "High" | "Fatal" | null;
    notes?: string | null;
  }
) {
  const supabase = await sbServer();

  const updateData: any = {};
  if (data.personName !== undefined) updateData.person_name = data.personName;
  if (data.dietType !== undefined) updateData.diet_type = data.dietType;
  if (data.allergy !== undefined) updateData.allergy = data.allergy;
  if (data.severity !== undefined) updateData.severity = data.severity;
  if (data.notes !== undefined) updateData.notes = data.notes;

  const { data: profile, error } = await (supabase.from("dietary_profiles") as any)
    .update(updateData)
    .eq("id", profileId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update dietary profile: ${error.message}`);
  }

  revalidatePath("/portal/[bookingRef]");
  return profile;
}

export async function customerDeleteDietaryProfile(profileId: string) {
  const supabase = await sbServer();

  const { error } = await (supabase.from("dietary_profiles") as any)
    .delete()
    .eq("id", profileId);

  if (error) {
    throw new Error(`Failed to delete dietary profile: ${error.message}`);
  }

  revalidatePath("/portal/[bookingRef]");
}

export async function customerUpdateMealAttendance(
  dietaryProfileId: string,
  mealJobId: string,
  attending: boolean
) {
  const supabase = await sbServer();

  // Upsert - insert if not exists, update if exists
  const { error } = await (supabase.from("dietary_meal_attendance") as any)
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

  revalidatePath("/portal/[bookingRef]");
}

export async function getDietaryMealAttendance(bookingId: string) {
  const supabase = await sbServer();

  // Get all dietary profiles for this booking
  const { data: profiles, error: profilesError } = await (supabase.from("dietary_profiles") as any)
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
  const { data: attendance, error: attendanceError } = await (supabase.from("dietary_meal_attendance") as any)
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
