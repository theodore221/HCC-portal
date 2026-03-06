// @ts-nocheck
import type { Enums } from "@/lib/database.types";
import {
  getBookingDisplayName,
  type BookingWithMeta,
  type MealJobDetail,
} from "@/lib/queries/bookings";

export type EnrichedMealJob = {
  id: string;
  bookingId: string | null;
  date: string;
  meal: Enums<"meal_type">;
  timeSlot: Enums<"meal_type">;
  countsTotal: number;
  dietaryCounts: Record<string, number>;
  percolatedCoffee: boolean;
  percolatedCoffeeQuantity: number | null;
  assignedCatererId: string | null;
  assignedCaterer: string | null;
  assignedCatererColor: string | null;
  changesRequested: boolean;
  status: Enums<"meal_job_status">;
  menu: string[];
  menuIds: string[];
  groupName: string;
  isLinkedToBooking: boolean;
  startDate: Date;
  endDate: Date;
  startISOString: string;
  endISOString: string;
  formattedDate: string;
  timeRangeLabel: string;
  requestedServiceTime: string | null;
};

export type MealJobComment = {
  id: string;
  mealJobId: string;
  authorId: string;
  authorRole: "admin" | "caterer";
  authorName: string;
  content: string;
  createdAt: Date;
};

export const MEAL_ORDER = [
  "Breakfast",
  "Morning Tea",
  "Lunch",
  "Afternoon Tea",
  "Dinner",
  "Dessert",
  "Supper",
];

/** Meal-type color system — "Botanical Kitchen" palette */
export const MEAL_COLORS: Record<string, { hex: string; tw: string }> = {
  Breakfast: { hex: "#d97706", tw: "meal-breakfast" },
  "Morning Tea": { hex: "#92400e", tw: "meal-morning-tea" },
  Lunch: { hex: "#6c8f36", tw: "meal-lunch" },
  "Afternoon Tea": { hex: "#2a8a7a", tw: "meal-afternoon-tea" },
  Dinner: { hex: "#7c3aed", tw: "meal-dinner" },
  Dessert: { hex: "#c49910", tw: "meal-dessert" },
  Supper: { hex: "#6b7280", tw: "meal-supper" },
};

const timeSlotMetadata: Record<Enums<"meal_type">, { start: string; end: string }> = {
  Breakfast: { start: "07:30", end: "08:30" },
  "Morning Tea": { start: "10:30", end: "11:15" },
  Lunch: { start: "12:30", end: "13:30" },
  "Afternoon Tea": { start: "15:00", end: "15:45" },
  Dinner: { start: "18:00", end: "19:15" },
  Dessert: { start: "19:30", end: "20:30" },
  Supper: { start: "21:00", end: "22:00" },
};

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "long",
  day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

function toDate(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

export function formatDateLabel(date: string) {
  return dateFormatter.format(new Date(`${date}T00:00:00`));
}

export function formatTimeRange(start: Date, end: Date) {
  return `${timeFormatter.format(start)} – ${timeFormatter.format(end)}`;
}

export function enrichMealJobs(
  jobs: MealJobDetail[],
  bookings: Array<Pick<BookingWithMeta, "id" | "customer_name" | "customer_email" | "reference">>,
): EnrichedMealJob[] {
  const bookingMap = new Map(bookings.map((booking) => [booking.id, booking]));

  const enriched = jobs.map((job) => {
    const metadata = timeSlotMetadata[job.meal];
    const startDate = metadata ? toDate(job.service_date, metadata.start) : toDate(job.service_date, "12:00");
    const endDate = metadata ? toDate(job.service_date, metadata.end) : new Date(startDate.getTime() + 60 * 60 * 1000);
    const booking = job.booking_id ? bookingMap.get(job.booking_id) : null;
    const isLinkedToBooking = !!booking;

    // group_name: prefer booking display name if linked, fall back to raw group_name column, then "Standalone"
    const groupName = booking
      ? getBookingDisplayName(booking)
      : (job.group_name ?? "Standalone");

    return {
      id: job.id,
      bookingId: job.booking_id ?? null,
      date: job.service_date,
      meal: job.meal,
      timeSlot: job.meal,
      countsTotal: job.counts_total,
      dietaryCounts: job.counts_by_diet,
      percolatedCoffee: job.percolated_coffee,
      percolatedCoffeeQuantity: job.percolated_coffee_quantity,
      assignedCatererId: job.assigned_caterer_id,
      assignedCaterer: job.assigned_caterer_name,
      assignedCatererColor: job.assigned_caterer_color ?? null,
      changesRequested: job.changes_requested ?? false,
      status: job.status,
      menu: job.menu_labels,
      menuIds: job.menu_ids,
      groupName,
      isLinkedToBooking,
      startDate,
      endDate,
      startISOString: startDate.toISOString(),
      endISOString: endDate.toISOString(),
      formattedDate: formatDateLabel(job.service_date),
      timeRangeLabel: `${job.meal} • ${formatTimeRange(startDate, endDate)}`,
      requestedServiceTime: job.requested_service_time ?? null,
    } satisfies EnrichedMealJob;
  });

  return enriched.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
}
