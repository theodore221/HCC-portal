import { getCurrentProfile } from "@/lib/auth/server";
import { getTimesheets, getFortnightBounds } from "@/lib/queries/rostering.server";
import { redirect } from "next/navigation";
import { TimesheetClient } from "./client";

export default async function TimesheetPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string }>;
}) {
  const { profile } = await getCurrentProfile();
  if (!profile) redirect("/login");

  const params = await searchParams;
  const bounds = getFortnightBounds(params.start);
  const currentPeriodStart = getFortnightBounds().start;

  const timesheets = await getTimesheets({
    staffId: profile.id,
    startDate: bounds.start,
    endDate: bounds.end,
  });

  return (
    <TimesheetClient
      timesheets={timesheets}
      periodStart={bounds.start}
      periodEnd={bounds.end}
      currentPeriodStart={currentPeriodStart}
    />
  );
}
