"use server";

import { revalidatePath } from "next/cache";
import { sbServer } from "@/lib/supabase-server";

/**
 * Mark a room as cleaned for a specific date
 */
export async function markRoomCleaned(
  roomId: string,
  date: string,
  bookingId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await sbServer();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Upsert (in case they're re-marking)
    const { error } = await (supabase.from("room_status_logs") as any).upsert(
      {
        room_id: roomId,
        action_type: "cleaned" as const,
        action_date: date,
        performed_by: user.id,
        booking_id: bookingId || null,
      },
      {
        onConflict: "room_id,action_date,action_type",
      }
    );

    if (error) {
      return {
        success: false,
        error: `Failed to mark room cleaned: ${error.message}`,
      };
    }

    revalidatePath("/staff/rooms");
    revalidatePath("/admin/rooms");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Mark a room as setup complete for a specific date
 */
export async function markRoomSetupComplete(
  roomId: string,
  date: string,
  bookingId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await sbServer();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { error } = await (supabase.from("room_status_logs") as any).upsert(
      {
        room_id: roomId,
        action_type: "setup_complete" as const,
        action_date: date,
        performed_by: user.id,
        booking_id: bookingId || null,
      },
      {
        onConflict: "room_id,action_date,action_type",
      }
    );

    if (error) {
      return {
        success: false,
        error: `Failed to mark setup complete: ${error.message}`,
      };
    }

    revalidatePath("/staff/rooms");
    revalidatePath("/admin/rooms");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Undo a room action (cleaned or setup_complete)
 */
export async function undoRoomAction(
  roomId: string,
  date: string,
  actionType: "cleaned" | "setup_complete"
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await sbServer();

    const { error } = await (supabase.from("room_status_logs") as any)
      .delete()
      .eq("room_id", roomId)
      .eq("action_date", date)
      .eq("action_type", actionType);

    if (error) {
      return {
        success: false,
        error: `Failed to undo action: ${error.message}`,
      };
    }

    revalidatePath("/staff/rooms");
    revalidatePath("/admin/rooms");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
