import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateRange(start: string | Date, end: string | Date) {
  const startDate = typeof start === "string" ? new Date(start) : start;
  const endDate = typeof end === "string" ? new Date(end) : end;
  const sameMonth =
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth();
  const dateFormatter = new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: sameMonth ? undefined : "short",
  });
  const monthFormatter = new Intl.DateTimeFormat("en-AU", {
    month: "short",
    year: "numeric",
  });
  const startDay = dateFormatter.format(startDate);
  const endDay = dateFormatter.format(endDate);
  const monthLabel = monthFormatter.format(endDate);
  return `${startDay} – ${endDay} ${monthLabel}`;
}
