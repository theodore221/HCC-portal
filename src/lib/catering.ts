import { BookingSummary, MealJob } from "@/lib/mock-data";

export type EnrichedMealJob = MealJob & {
  groupName: string;
  startDate: Date;
  endDate: Date;
  startISOString: string;
  endISOString: string;
  formattedDate: string;
  timeRangeLabel: string;
};

const timeSlotMetadata: Record<MealJob["timeSlot"], { start: string; end: string }> = {
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

export function enrichMealJobs(
  jobs: MealJob[],
  bookings: BookingSummary[]
): EnrichedMealJob[] {
  const bookingMap = new Map(bookings.map((booking) => [booking.id, booking]));

  const enriched = jobs.map((job) => {
    const metadata = timeSlotMetadata[job.timeSlot];
    const startDate = metadata ? toDate(job.date, metadata.start) : toDate(job.date, "12:00");
    const endDate = metadata ? toDate(job.date, metadata.end) : new Date(startDate.getTime() + 60 * 60 * 1000);
    const booking = bookingMap.get(job.bookingId);

    return {
      ...job,
      groupName: booking?.groupName ?? "Unassigned group",
      startDate,
      endDate,
      startISOString: startDate.toISOString(),
      endISOString: endDate.toISOString(),
      formattedDate: formatDateLabel(job.date),
      timeRangeLabel: `${job.timeSlot} • ${formatTimeRange(startDate, endDate)}`,
    };
  });

  return enriched.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
}
