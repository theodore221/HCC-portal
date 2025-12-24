// @ts-nocheck
import { sbServer } from "@/lib/supabase-server";
import type { Tables, Views } from "@/lib/database.types";
import type {
  BookingWithMeta,
  DietaryProfile,
  MealJobDetail,
  RoomWithAssignments,
  SpaceReservation,
} from "./bookings";

function parseCounts(
  json: Tables<"meal_jobs">["counts_by_diet"]
): Record<string, number> {
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    return {};
  }

  return Object.entries(json as Record<string, unknown>).reduce<
    Record<string, number>
  >((acc, [key, value]) => {
    if (typeof value === "number") {
      acc[key] = value;
    } else if (typeof value === "string") {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) {
        acc[key] = parsed;
      }
    }
    return acc;
  }, {});
}

function conflictLabel(
  conflict: Views<"v_space_conflicts">,
  bookingLookup: Map<string, Tables<"bookings">>,
  spaceLookup: Map<string, Tables<"spaces">>
): string {
  const spaceName = conflict.space_id
    ? spaceLookup.get(conflict.space_id)?.name ?? conflict.space_id
    : "Unknown space";
  const dateLabel = conflict.service_date ?? "Date TBC";
  const other = conflict.conflicts_with
    ? bookingLookup.get(conflict.conflicts_with)?.reference ??
      conflict.conflicts_with
    : null;

  return other
    ? `${spaceName} · ${dateLabel} · conflict with ${other}`
    : `${spaceName} · ${dateLabel}`;
}

function deriveConflicts(
  bookingId: string,
  myReservations: SpaceReservation[],
  otherReservations: SpaceReservation[]
): Views<"v_space_conflicts">[] {
  const conflicts: Views<"v_space_conflicts">[] = [];

  for (const myRes of myReservations) {
    for (const otherRes of otherReservations) {
      if (
        myRes.space_id !== otherRes.space_id ||
        myRes.service_date !== otherRes.service_date
      ) {
        continue;
      }

      const myStart = myRes.start_time ?? "00:00";
      const myEnd = myRes.end_time ?? "23:59";
      const otherStart = otherRes.start_time ?? "00:00";
      const otherEnd = otherRes.end_time ?? "23:59";

      if (myStart < otherEnd && otherStart < myEnd) {
        conflicts.push({
          booking_id: bookingId,
          space_id: myRes.space_id,
          service_date: myRes.service_date,
          conflicts_with: otherRes.booking_id,
        });
      }
    }
  }

  return conflicts;
}

export async function getBookingsForAdmin(): Promise<BookingWithMeta[]> {
  const supabase = await sbServer();

  const [
    { data: bookings, error: bookingsError },
    { data: reservations, error: reservationsError },
    { data: spaces, error: spacesError },
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select("*")
      .order("arrival_date", { ascending: true }),
    supabase
      .from("space_reservations")
      .select(
        "booking_id, space_id, service_date, start_time, end_time, status"
      ),
    supabase.from("spaces").select("id, name"),
  ]);

  if (bookingsError)
    throw new Error(`Failed to load bookings: ${bookingsError.message}`);
  if (reservationsError)
    throw new Error(
      `Failed to load space reservations: ${reservationsError.message}`
    );
  if (spacesError)
    throw new Error(`Failed to load spaces: ${spacesError.message}`);

  const spaceLookup = new Map((spaces ?? []).map((space) => [space.id, space]));
  const bookingLookup = new Map(
    (bookings ?? []).map((booking) => [booking.id, booking])
  );

  const spacesByBooking = new Map<string, Set<string>>();
  for (const reservation of reservations ?? []) {
    if (!reservation.booking_id) continue;
    const set =
      spacesByBooking.get(reservation.booking_id) ?? new Set<string>();
    const label = reservation.space_id
      ? spaceLookup.get(reservation.space_id)?.name ?? reservation.space_id
      : null;
    if (label) {
      set.add(label);
      spacesByBooking.set(reservation.booking_id, set);
    }
  }

  const conflictsByBooking = new Map<string, string[]>();
  for (const booking of bookings ?? []) {
    const myReservations = (reservations ?? []).filter(
      (res) => res.booking_id === booking.id
    );
    const overlappingReservations = (reservations ?? []).filter(
      (res) =>
        res.booking_id !== booking.id &&
        res.service_date >= booking.arrival_date &&
        res.service_date <= booking.departure_date
    );

    const conflicts = deriveConflicts(
      booking.id,
      myReservations,
      overlappingReservations
    );
    const labels = conflicts.map((conflict) =>
      conflictLabel(conflict, bookingLookup, spaceLookup)
    );
    conflictsByBooking.set(booking.id, labels);
  }

  return (bookings ?? []).map((booking) => ({
    ...booking,
    spaces: Array.from(spacesByBooking.get(booking.id) ?? []).sort((a, b) =>
      a.localeCompare(b)
    ),
    conflicts: conflictsByBooking.get(booking.id) ?? [],
  }));
}

export async function getBookingByReference(
  reference: string
): Promise<BookingWithMeta | null> {
  const supabase = await sbServer();
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      reference
    );

  let query = supabase.from("bookings").select("*");

  if (isUuid) {
    query = query.or(`reference.eq.${reference},id.eq.${reference}`);
  } else {
    query = query.eq("reference", reference);
  }

  const { data: booking, error } = await query.maybeSingle();

  if (error) throw new Error(`Failed to load booking: ${error.message}`);
  if (!booking) return null;

  const [
    { data: reservations, error: reservationsError },
    { data: conflicts, error: conflictsError },
    { data: spaces, error: spacesError },
  ] = await Promise.all([
    supabase
      .from("space_reservations")
      .select("space_id")
      .eq("booking_id", booking.id),
    supabase
      .from("v_space_conflicts")
      .select("booking_id, conflicts_with, space_id, service_date")
      .eq("booking_id", booking.id),
    supabase.from("spaces").select("id, name"),
  ]);

  if (reservationsError)
    throw new Error(
      `Failed to load spaces for booking: ${reservationsError.message}`
    );
  if (conflictsError)
    throw new Error(
      `Failed to load conflicts for booking: ${conflictsError.message}`
    );
  if (spacesError)
    throw new Error(`Failed to load spaces metadata: ${spacesError.message}`);

  const spaceLookup = new Map((spaces ?? []).map((space) => [space.id, space]));
  const bookingLookup = new Map([[booking.id, booking]]);

  const spacesForBooking = (reservations ?? []).reduce<string[]>(
    (acc, reservation) => {
      if (!reservation.space_id) return acc;
      const label =
        spaceLookup.get(reservation.space_id)?.name ?? reservation.space_id;
      if (!acc.includes(label)) acc.push(label);
      return acc;
    },
    []
  );

  const conflictMessages = (conflicts ?? []).map((conflict) =>
    conflictLabel(conflict, bookingLookup, spaceLookup)
  );

  return {
    ...booking,
    spaces: spacesForBooking.sort((a, b) => a.localeCompare(b)),
    conflicts: conflictMessages,
  };
}

async function getMenuDetailsForJobs(
  supabase: Awaited<ReturnType<typeof sbServer>>,
  jobIds: string[]
) {
  if (!jobIds.length) return new Map<string, { id: string; label: string }[]>();

  const { data: items, error } = await supabase
    .from("meal_job_items")
    .select("meal_job_id, menu_item_id")
    .in("meal_job_id", jobIds);
  if (error) throw new Error(`Failed to load meal job items: ${error.message}`);

  const validItems = items as
    | { meal_job_id: string; menu_item_id: string }[]
    | null;

  const menuItemIds = Array.from(
    new Set((validItems ?? []).map((item) => item.menu_item_id))
  );
  if (!menuItemIds.length) {
    return new Map();
  }

  const { data: menuItems, error: menuError } = await supabase
    .from("menu_items")
    .select("id, label")
    .in("id", menuItemIds);
  if (menuError)
    throw new Error(`Failed to load menu items: ${menuError.message}`);

  const validMenuItems = menuItems as { id: string; label: string }[] | null;

  const menuLookup = new Map(
    (validMenuItems ?? []).map((item) => [item.id, item.label])
  );
  const map = new Map<string, { id: string; label: string }[]>();
  for (const item of validItems ?? []) {
    const label = item.menu_item_id
      ? menuLookup.get(item.menu_item_id)
      : undefined;
    if (!item.meal_job_id || !label || !item.menu_item_id) continue;

    const list = map.get(item.meal_job_id) ?? [];
    if (!list.some((i) => i.id === item.menu_item_id)) {
      list.push({ id: item.menu_item_id, label });
    }
    map.set(item.meal_job_id, list);
  }

  return map;
}

async function getCatererNames(
  supabase: Awaited<ReturnType<typeof sbServer>>,
  catererIds: string[]
): Promise<Map<string, string>> {
  if (!catererIds.length) return new Map();

  const { data, error } = await supabase
    .from("caterers")
    .select("id, name")
    .in("id", catererIds);
  if (error) throw new Error(`Failed to load caterers: ${error.message}`);

  const validCaterers = data as { id: string; name: string }[] | null;

  return new Map(
    (validCaterers ?? []).map((caterer) => [caterer.id, caterer.name])
  );
}

function mapMealJobs(
  jobs: Tables<"meal_jobs">[] | null,
  menuDetails: Map<string, { id: string; label: string }[]>,
  catererLookup: Map<string, string>
): MealJobDetail[] {
  return (jobs ?? []).map((job) => {
    const details = menuDetails.get(job.id) ?? [];
    return {
      ...job,
      counts_by_diet: parseCounts(job.counts_by_diet),
      menu_labels: details.map((d) => d.label),
      menu_ids: details.map((d) => d.id),
      assigned_caterer_name: job.assigned_caterer_id
        ? catererLookup.get(job.assigned_caterer_id) ?? null
        : null,
      percolated_coffee_quantity:
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (job as any).percolated_coffee_quantity ?? null,
    };
  });
}

export async function getMealJobsForBooking(
  bookingId: string
): Promise<MealJobDetail[]> {
  const supabase = await sbServer();
  const { data: jobs, error } = await supabase
    .from("meal_jobs")
    .select("*")
    .eq("booking_id", bookingId)
    .order("service_date", { ascending: true })
    .order("meal", { ascending: true });

  if (error) throw new Error(`Failed to load meal jobs: ${error.message}`);

  const jobIds = (jobs ?? []).map((job) => job.id);
  const menuDetails = await getMenuDetailsForJobs(supabase, jobIds);
  const catererIds = Array.from(
    new Set(
      (jobs ?? [])
        .map((job) => job.assigned_caterer_id)
        .filter(Boolean) as string[]
    )
  );
  const caterers = await getCatererNames(supabase, catererIds);

  return mapMealJobs(jobs, menuDetails, caterers);
}

export async function getAssignedMealJobs(
  catererId?: string
): Promise<MealJobDetail[]> {
  const supabase = await sbServer();
  const query = supabase
    .from("meal_jobs")
    .select("*")
    .order("service_date", { ascending: true })
    .order("meal", { ascending: true });

  const { data: jobs, error } = catererId
    ? await query.eq("assigned_caterer_id", catererId)
    : await query;

  if (error) throw new Error(`Failed to load meal jobs: ${error.message}`);

  const jobIds = (jobs ?? []).map((job) => job.id);
  const menuDetails = await getMenuDetailsForJobs(supabase, jobIds);
  const catererIds = Array.from(
    new Set(
      (jobs ?? [])
        .map((job) => job.assigned_caterer_id)
        .filter(Boolean) as string[]
    )
  );
  const caterers = await getCatererNames(supabase, catererIds);

  return mapMealJobs(jobs, menuDetails, caterers);
}

export async function getRoomsForBooking(
  bookingId: string
): Promise<RoomWithAssignments[]> {
  const supabase = await sbServer();
  const { data: assignments, error } = await supabase
    .from("room_assignments")
    .select("*")
    .eq("booking_id", bookingId)
    .order("room_id", { ascending: true })
    .order("bed_number", { ascending: true });

  if (error)
    throw new Error(`Failed to load room assignments: ${error.message}`);

  const roomIds = Array.from(
    new Set((assignments ?? []).map((assignment) => assignment.room_id))
  );
  if (!roomIds.length) {
    return [];
  }

  const { data: rooms, error: roomsError } = await supabase
    .from("rooms")
    .select("*, room_types(*)")
    .in("id", roomIds);
  if (roomsError)
    throw new Error(`Failed to load rooms: ${roomsError.message}`);

  const roomLookup = new Map((rooms ?? []).map((room) => [room.id, room]));
  const grouped = new Map<string, Tables<"room_assignments">[]>();
  for (const assignment of assignments ?? []) {
    const list = grouped.get(assignment.room_id) ?? [];
    list.push(assignment);
    grouped.set(assignment.room_id, list);
  }

  return Array.from(roomLookup.values()).map((room) => ({
    ...room,
    assignments:
      grouped.get(room.id)?.sort((a, b) => a.bed_number - b.bed_number) ?? [],
  }));
}

export async function getDietaryProfilesForBooking(
  bookingId: string
): Promise<DietaryProfile[]> {
  const supabase = await sbServer();
  const { data, error } = await supabase
    .from("dietary_profiles")
    .select("*")
    .eq("booking_id", bookingId)
    .order("person_name", { ascending: true });

  if (error)
    throw new Error(`Failed to load dietary profiles: ${error.message}`);
  return data ?? [];
}
