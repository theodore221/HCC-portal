"use server";

import { revalidatePath } from "next/cache";
import { sbServer } from "@/lib/supabase-server";

export async function createGuest(bookingId: string, name: string) {
  const supabase = await sbServer();

  const { data, error } = await (supabase.from("guests") as any)
    .insert({
      booking_id: bookingId,
      full_name: name,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating guest:", error);
    throw new Error("Failed to create guest");
  }

  revalidatePath("/portal/[bookingRef]");
  return data;
}

export async function updateGuest(
  guestId: string,
  updates: { full_name?: string; notes?: string }
) {
  const supabase = await sbServer();

  const { error } = await (supabase.from("guests") as any)
    .update(updates)
    .eq("id", guestId);

  if (error) {
    console.error("Error updating guest:", error);
    throw new Error("Failed to update guest");
  }

  revalidatePath("/portal/[bookingRef]");
}

export async function deleteGuest(guestId: string) {
  const supabase = await sbServer();

  const { error } = await (supabase.from("guests") as any).delete().eq("id", guestId);

  if (error) {
    console.error("Error deleting guest:", error);
    throw new Error("Failed to delete guest");
  }

  revalidatePath("/portal/[bookingRef]");
}

export async function populateGuests(bookingId: string, count: number) {
  const supabase = await sbServer();

  const guests = Array.from({ length: count }, (_, i) => ({
    booking_id: bookingId,
    full_name: `Guest ${i + 1}`,
  }));

  const { error } = await (supabase.from("guests") as any).insert(guests);

  if (error) {
    console.error("Error populating guests:", error);
    throw new Error("Failed to populate guests");
  }

  revalidatePath("/portal/[bookingRef]");
}
