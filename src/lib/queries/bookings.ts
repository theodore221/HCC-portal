import type { Enums, Tables } from "@/lib/database.types";

export type BookingStatus = Enums<"booking_status">;

export type BookingWithMeta = Tables<"bookings"> & {
  spaces: string[];
  conflicts: string[];
  accommodation_requests?: Record<string, number> | null;
};

export type MealJobDetail = Omit<Tables<"meal_jobs">, "counts_by_diet"> & {
  counts_by_diet: Record<string, number>;
  counts_total: number;
  menu_labels: string[];
  menu_ids: string[];
  assigned_caterer_name: string | null;
  assigned_caterer_color: string | null;
  percolated_coffee_quantity: number | null;
  requested_service_time: string | null;
  changes_requested: boolean;
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
  room_types?: Tables<"room_types"> | null;
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
