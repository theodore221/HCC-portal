// @ts-nocheck
import { sbServer } from "@/lib/supabase-server";
import type { Tables } from "@/lib/database.types";

// Standard meal times for comparison
const STANDARD_MEAL_TIMES: Record<string, string> = {
  Breakfast: "08:00:00",
  "Morning Tea": "10:30:00",
  Lunch: "12:30:00",
  "Afternoon Tea": "15:00:00",
  Dinner: "18:00:00",
  Dessert: "19:30:00",
  Supper: "20:30:00",
};

// Day of week abbreviations
const DAY_ABBREVIATIONS = ["S", "M", "T", "W", "T", "F", "S"];

export type ScheduleRow = {
  id: string;
  arrivalDate: string;
  departureDate: string;
  dayOfWeek: string;
  groupName: string;
  spaces: string[];
  chapelUse: boolean;
  minors: boolean;
  guests: number;
  catering: "Yes" | "Self" | "Breakfast";
  overnightStay: boolean;
  lawn: boolean;
  arrivalTime: string | null;
  departureTime: string | null;
  contactPerson: string | null;
  cateringType: "Catered" | "Self Managed";
  hasDietaries: boolean;
  mealTimes: "Standard" | "Altered";
  percolatedCoffee: boolean;
  bedType: "BYO Linen" | "Fully Provided" | null;
  roomList: string | null;
  notes: string | null;
  // Additional fields for linking
  reference: string | null;
  status: Tables<"bookings">["status"];
};

function getDayAbbreviation(dateStr: string): string {
  const date = new Date(dateStr);
  return DAY_ABBREVIATIONS[date.getDay()];
}

function formatTime(time: string | null): string | null {
  if (!time) return null;
  // Convert "HH:MM:SS" or "HH:MM" to "HH:MM" format
  const parts = time.split(":");
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return time;
}

function deriveCatering(
  cateringRequired: boolean,
  isOvernight: boolean
): "Yes" | "Self" | "Breakfast" {
  if (cateringRequired) return "Yes";
  if (isOvernight) return "Breakfast";
  return "Self";
}

function checkAlteredMealTimes(
  mealJobs: { meal: string; service_time: string | null }[]
): boolean {
  for (const job of mealJobs) {
    if (!job.service_time) continue;
    const standardTime = STANDARD_MEAL_TIMES[job.meal];
    if (standardTime && job.service_time !== standardTime) {
      // Compare just HH:MM portion
      const jobTime = job.service_time.substring(0, 5);
      const standard = standardTime.substring(0, 5);
      if (jobTime !== standard) {
        return true;
      }
    }
  }
  return false;
}

function checkPercolatedCoffee(
  mealJobs: { meal: string; percolated_coffee: boolean }[]
): boolean {
  return mealJobs.some(
    (job) =>
      (job.meal === "Morning Tea" || job.meal === "Afternoon Tea") &&
      job.percolated_coffee
  );
}

function getBedType(
  accommodationRequests: unknown
): "BYO Linen" | "Fully Provided" | null {
  if (!accommodationRequests || typeof accommodationRequests !== "object") {
    return null;
  }
  const requests = accommodationRequests as Record<string, unknown>;
  if ("byo_linen" in requests) {
    return requests.byo_linen === true ? "BYO Linen" : "Fully Provided";
  }
  // If no byo_linen field but has accommodation requests, default to Fully Provided
  const hasAccommodation = Object.keys(requests).some(
    (key) =>
      key !== "byo_linen" &&
      typeof requests[key] === "number" &&
      (requests[key] as number) > 0
  );
  return hasAccommodation ? "Fully Provided" : null;
}

export async function getScheduleData(): Promise<ScheduleRow[]> {
  const supabase = await sbServer();

  // Fetch all data in parallel
  const [
    { data: bookings, error: bookingsError },
    { data: reservations, error: reservationsError },
    { data: spaces, error: spacesError },
    { data: dietaryProfiles, error: dietaryError },
    { data: mealJobs, error: mealJobsError },
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select("*")
      .neq("status", "Cancelled")
      .order("arrival_date", { ascending: true }),
    supabase
      .from("space_reservations")
      .select("booking_id, space_id"),
    supabase.from("spaces").select("id, name"),
    supabase
      .from("dietary_profiles")
      .select("booking_id"),
    supabase
      .from("meal_jobs")
      .select("booking_id, meal, service_time, percolated_coffee"),
  ]);

  if (bookingsError)
    throw new Error(`Failed to load bookings: ${bookingsError.message}`);
  if (reservationsError)
    throw new Error(`Failed to load reservations: ${reservationsError.message}`);
  if (spacesError)
    throw new Error(`Failed to load spaces: ${spacesError.message}`);
  if (dietaryError)
    throw new Error(`Failed to load dietary profiles: ${dietaryError.message}`);
  if (mealJobsError)
    throw new Error(`Failed to load meal jobs: ${mealJobsError.message}`);

  // Create lookups
  const spaceLookup = new Map(
    (spaces ?? []).map((space) => [space.id, space.name])
  );

  // Group reservations by booking
  const reservationsByBooking = new Map<string, Set<string>>();
  for (const res of reservations ?? []) {
    if (!res.booking_id || !res.space_id) continue;
    const set = reservationsByBooking.get(res.booking_id) ?? new Set();
    const spaceName = spaceLookup.get(res.space_id) ?? res.space_id;
    set.add(spaceName);
    reservationsByBooking.set(res.booking_id, set);
  }

  // Group dietary profiles by booking (just need to know if any exist)
  const bookingsWithDietaries = new Set<string>();
  for (const profile of dietaryProfiles ?? []) {
    if (profile.booking_id) {
      bookingsWithDietaries.add(profile.booking_id);
    }
  }

  // Group meal jobs by booking
  const mealJobsByBooking = new Map<
    string,
    { meal: string; service_time: string | null; percolated_coffee: boolean }[]
  >();
  for (const job of mealJobs ?? []) {
    if (!job.booking_id) continue;
    const list = mealJobsByBooking.get(job.booking_id) ?? [];
    list.push({
      meal: job.meal,
      service_time: job.service_time,
      percolated_coffee: job.percolated_coffee,
    });
    mealJobsByBooking.set(job.booking_id, list);
  }

  // Transform bookings to schedule rows
  return (bookings ?? []).map((booking) => {
    const spaceNames = reservationsByBooking.get(booking.id) ?? new Set();
    const spacesArray = Array.from(spaceNames).sort((a, b) =>
      a.localeCompare(b)
    );
    const bookingMealJobs = mealJobsByBooking.get(booking.id) ?? [];

    return {
      id: booking.id,
      arrivalDate: booking.arrival_date,
      departureDate: booking.departure_date,
      dayOfWeek: getDayAbbreviation(booking.arrival_date),
      groupName: booking.customer_name ?? booking.customer_email ?? "Unknown",
      spaces: spacesArray,
      chapelUse: booking.chapel_required,
      minors: booking.minors,
      guests: booking.headcount,
      catering: deriveCatering(booking.catering_required, booking.is_overnight),
      overnightStay: booking.is_overnight,
      lawn: spaceNames.has("Outdoor Picnic Space"),
      arrivalTime: formatTime(booking.arrival_time),
      departureTime: formatTime(booking.departure_time),
      contactPerson: booking.contact_name,
      cateringType: booking.catering_required ? "Catered" : "Self Managed",
      hasDietaries: bookingsWithDietaries.has(booking.id),
      mealTimes: checkAlteredMealTimes(bookingMealJobs) ? "Altered" : "Standard",
      percolatedCoffee: checkPercolatedCoffee(bookingMealJobs),
      bedType: getBedType(booking.accommodation_requests),
      roomList: null, // Future feature
      notes: booking.notes,
      reference: booking.reference,
      status: booking.status,
    };
  });
}

// Get schedule data filtered by date range
export async function getScheduleDataByDateRange(
  startDate: string,
  endDate: string
): Promise<ScheduleRow[]> {
  const allData = await getScheduleData();
  return allData.filter(
    (row) => row.arrivalDate >= startDate && row.arrivalDate <= endDate
  );
}
