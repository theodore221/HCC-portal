import { getTimesheets, getFortnightBounds } from "@/lib/queries/rostering.server";
import { TimesheetsClient } from "./client";

export default async function AdminTimesheetsPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string; mode?: string }>;
}) {
  const params = await searchParams;
  const isCustom = params.mode === "custom" && !!params.start && !!params.end;

  let periodStart: string, periodEnd: string;
  if (isCustom) {
    periodStart = params.start!;
    periodEnd = params.end!;
  } else {
    const bounds = getFortnightBounds(params.start);
    periodStart = bounds.start;
    periodEnd = bounds.end;
  }

  const currentPeriodStart = getFortnightBounds().start;
  const timesheets = await getTimesheets({ startDate: periodStart, endDate: periodEnd });

  return (
    <TimesheetsClient
      timesheets={timesheets}
      periodStart={periodStart}
      periodEnd={periodEnd}
      currentPeriodStart={currentPeriodStart}
      mode={isCustom ? "custom" : "fortnight"}
    />
  );
}
