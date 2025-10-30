import { sbServer } from "../supabase";
import type { Database } from "../database.types";

export type BookingStatus = Database["public"]["Enums"]["booking_status"];
export type MealJobStatus = Database["public"]["Enums"]["meal_job_status"];
export type MealType = Database["public"]["Enums"]["meal_type"];
export type Severity = Database["public"]["Enums"]["severity"];

export type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
export type SpaceReservationRow = Database["public"]["Tables"]["space_reservations"]["Row"];
export type MealJobRow = Database["public"]["Tables"]["meal_jobs"]["Row"];
export type MealJobItemRow = Database["public"]["Tables"]["meal_job_items"]["Row"];
export type MenuItemRow = Database["public"]["Tables"]["menu_items"]["Row"];
export type DietaryProfileRow = Database["public"]["Tables"]["dietary_profiles"]["Row"];
export type RoomAssignmentRow = Database["public"]["Tables"]["room_assignments"]["Row"];
export type RoomRow = Database["public"]["Tables"]["rooms"]["Row"];
export type CatererRow = Database["public"]["Tables"]["caterers"]["Row"];

export type SpaceReservationSummary = Pick<
  SpaceReservationRow,
  "id" | "space_id" | "service_date" | "start_time" | "end_time" | "status"
>;

export type MealJobMenuItem = {
  menu_items: Pick<MenuItemRow, "id" | "label"> | null;
};

export type MealJobWithMenu = MealJobRow & {
  meal_job_items: MealJobMenuItem[];
};

export type MealJobWithRelations = MealJobRow & {
  booking: Pick<
    BookingRow,
    | "id"
    | "reference"
    | "customer_name"
    | "customer_email"
    | "headcount"
    | "arrival_date"
    | "departure_date"
    | "is_overnight"
    | "catering_required"
    | "status"
  > | null;
  meal_job_items: MealJobMenuItem[];
  assigned_caterer: Pick<CatererRow, "id" | "name"> | null;
};

export type BookingDetail = BookingRow & {
  space_reservations: SpaceReservationSummary[];
  meal_jobs: MealJobWithMenu[];
  dietary_profiles: DietaryProfileRow[];
  room_assignments: (RoomAssignmentRow & { rooms: RoomRow | null })[];
};

export type AdminBooking = BookingRow & {
  space_reservations: SpaceReservationSummary[];
};

function handleSupabaseError(context: string, error: { message: string } | null) {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }
}

export async function getBookingsForAdmin(): Promise<AdminBooking[]> {
  const supabase = sbServer();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `*,
       space_reservations (
         id,
         space_id,
         service_date,
         start_time,
         end_time,
         status
       )
    `)
    .order("arrival_date", { ascending: true });

  handleSupabaseError("Failed to load bookings", error);
  return (data ?? []) as AdminBooking[];
}

export async function getBookingByReference(
  reference: string
): Promise<BookingDetail | null> {
  const supabase = sbServer();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `*,
       space_reservations (
         id,
         space_id,
         service_date,
         start_time,
         end_time,
         status
       ),
       meal_jobs (
         *,
         meal_job_items (
           menu_items (
             id,
             label
           )
         )
       ),
       dietary_profiles (*),
       room_assignments (
         *,
         rooms (
           id,
           name,
           building,
           base_beds,
           extra_bed_allowed,
           extra_bed_fee,
           active
         )
       )
    `)
    .eq("reference", reference)
    .maybeSingle();

  handleSupabaseError("Failed to load booking", error);
  if (!data) {
    return null;
  }
  return data as BookingDetail;
}

export async function getMealJobsForBooking(
  bookingId: string
): Promise<MealJobWithMenu[]> {
  const supabase = sbServer();
  const { data, error } = await supabase
    .from("meal_jobs")
    .select(
      `*,
       meal_job_items (
         menu_items (
           id,
           label
         )
       )
    `)
    .eq("booking_id", bookingId)
    .order("service_date", { ascending: true })
    .order("meal", { ascending: true });

  handleSupabaseError("Failed to load meal jobs", error);
  return (data ?? []) as MealJobWithMenu[];
}

export async function getRoomsForBooking(
  bookingId: string
): Promise<(RoomAssignmentRow & { rooms: RoomRow | null })[]> {
  const supabase = sbServer();
  const { data, error } = await supabase
    .from("room_assignments")
    .select(
      `*,
       rooms (
         id,
         name,
         building,
         base_beds,
         extra_bed_allowed,
         extra_bed_fee,
         active
       )
    `)
    .eq("booking_id", bookingId)
    .order("room_id", { ascending: true })
    .order("bed_number", { ascending: true });

  handleSupabaseError("Failed to load room assignments", error);
  return (data ?? []) as (RoomAssignmentRow & { rooms: RoomRow | null })[];
}

export async function getDietaryProfilesForBooking(
  bookingId: string
): Promise<DietaryProfileRow[]> {
  const supabase = sbServer();
  const { data, error } = await supabase
    .from("dietary_profiles")
    .select("*")
    .eq("booking_id", bookingId)
    .order("person_name", { ascending: true });

  handleSupabaseError("Failed to load dietary profiles", error);
  return data ?? [];
}

export async function getAssignedMealJobs(
  options?: { catererId?: string; bookingId?: string }
): Promise<MealJobWithRelations[]> {
  const supabase = sbServer();
  let query = supabase
    .from("meal_jobs")
    .select(
      `*,
       booking:bookings (
         id,
         reference,
         customer_name,
         customer_email,
         headcount,
         arrival_date,
         departure_date,
         is_overnight,
         catering_required,
         status
       ),
       meal_job_items (
         menu_items (
           id,
           label
         )
       ),
       assigned_caterer:caterers!assigned_caterer_id (
         id,
         name
       )
    `)
    .order("service_date", { ascending: true })
    .order("meal", { ascending: true });

  if (options?.catererId) {
    query = query.eq("assigned_caterer_id", options.catererId);
  }

  if (options?.bookingId) {
    query = query.eq("booking_id", options.bookingId);
  }

  const { data, error } = await query;

  handleSupabaseError("Failed to load assigned meal jobs", error);
  return (data ?? []) as MealJobWithRelations[];
}
