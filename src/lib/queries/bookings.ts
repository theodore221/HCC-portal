import type { Enums, Tables } from "@/lib/database.types";

export type BookingStatus = Enums<"booking_status">;

export type BookingWithMeta = Tables<"bookings"> & {
  spaces: string[];
  conflicts: string[];
};

export type MealJobDetail = Omit<Tables<"meal_jobs">, "counts_by_diet"> & {
  counts_by_diet: Record<string, number>;
  menu_labels: string[];
  assigned_caterer_name: string | null;
};

export type RoomWithAssignments = Tables<"rooms"> & {
  assignments: Tables<"room_assignments">[];
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
