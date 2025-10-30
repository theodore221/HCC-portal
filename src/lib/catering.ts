import type { MealJobWithRelations } from "./queries/bookings";

export type EnrichedMealJob = {
  id: string;
  bookingId: string;
  date: string;
  timeSlot: string;
  menu: string[];
  dietaryCounts: Record<string, number>;
  percolatedCoffee: boolean;
  assignedCaterer: string | null;
  status: MealJobWithRelations["status"];
  groupName: string;
  startDate: Date;
  endDate: Date;
  startISOString: string;
  endISOString: string;
  formattedDate: string;
  timeRangeLabel: string;
};

const timeSlotMetadata: Record<MealJobWithRelations["meal"], { start: string; end: string }> = {
  Breakfast: { start: "07:30", end: "08:30" },
  "Morning Tea": { start: "10:30", end: "11:15" },
  Lunch: { start: "12:30", end: "13:30" },
  "Afternoon Tea": { start: "15:00", end: "15:45" },
  Dinner: { start: "18:00", end: "19:15" },
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

function normaliseDietaryCounts(json: MealJobWithRelations["counts_by_diet"]): Record<string, number> {
  if (typeof json !== "object" || json === null) {
    return {};
  }

  const entries = Object.entries(json as Record<string, unknown>).map(([key, value]) => {
    if (typeof value === "number") {
      return [key, value];
    }
    if (typeof value === "string") {
      const parsed = Number(value);
      return [key, Number.isFinite(parsed) ? parsed : 0];
    }
    return [key, 0];
  });

  return Object.fromEntries(entries);
}

export function enrichMealJobs(jobs: MealJobWithRelations[]): EnrichedMealJob[] {
  const enriched = jobs.map((job) => {
    const metadata = timeSlotMetadata[job.meal];
    const startDate = metadata ? toDate(job.service_date, metadata.start) : toDate(job.service_date, "12:00");
    const endDate = metadata
      ? toDate(job.service_date, metadata.end)
      : new Date(startDate.getTime() + 60 * 60 * 1000);

    const menu = job.meal_job_items
      .map((item) => item.menu_items?.label)
      .filter((label): label is string => Boolean(label));

    const groupName = job.booking?.customer_name ?? job.booking?.customer_email ?? "Unassigned group";

    return {
      id: job.id,
      bookingId: job.booking_id,
      date: job.service_date,
      timeSlot: job.meal,
      menu,
      dietaryCounts: normaliseDietaryCounts(job.counts_by_diet),
      percolatedCoffee: job.percolated_coffee,
      assignedCaterer: job.assigned_caterer?.name ?? null,
      status: job.status,
      groupName,
      startDate,
      endDate,
      startISOString: startDate.toISOString(),
      endISOString: endDate.toISOString(),
      formattedDate: formatDateLabel(job.service_date),
      timeRangeLabel: `${job.meal} • ${formatTimeRange(startDate, endDate)}`,
    } satisfies EnrichedMealJob;
  });

  return enriched.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
}
