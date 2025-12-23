import type { Enums, Tables } from "@/lib/database.types";

export type BookingStatus = Enums<"booking_status">;

export type BookingWithMeta = Tables<"bookings"> & {
  spaces: string[];
  conflicts: string[];
  accommodation_requests?: Record<string, number> | null;
};

export type MealJobDetail = Omit<Tables<"meal_jobs">, "counts_by_diet"> & {
  counts_by_diet: Record<string, number>;
  menu_labels: string[];
  menu_ids: string[];
  assigned_caterer_name: string | null;
  percolated_coffee_quantity: number | null;
};

// Extended room_assignment with new fields (until types regenerated)
export type RoomAssignmentWithDetails = Tables<"room_assignments"> & {
  guest_names?: string[] | null;
  extra_bed_selected?: boolean | null;
  ensuite_selected?: boolean | null;
  private_study_selected?: boolean | null;
};

export type RoomWithAssignments = Tables<"rooms"> & {
  assignments: RoomAssignmentWithDetails[];
  // Manually add new fields until types are regenerated
  level?: string | null;
  room_number?: string | null;
  wing?: string | null;
};

export type DietaryProfile = Tables<"dietary_profiles">;

export type Space = Pick<Tables<"spaces">, "id" | "name" | "capacity">;

export type SpaceReservation = Tables<"space_reservations">;

export function getBookingDisplayName(booking: Tables<"bookings">) {
  return (
    booking.customer_name ??
    booking.customer_email ??
    booking.reference ??
    "Unknown group"
  );
}
