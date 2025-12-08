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
