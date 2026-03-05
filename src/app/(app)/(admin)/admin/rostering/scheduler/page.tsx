import {
  getShiftCalendarData,
  getStaffMembers,
  getRosterJobsWithTasks,
} from "@/lib/queries/rostering.server";
import { SchedulerClient } from "./client";

export default async function SchedulerPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // First day and last day of current month
  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const [calendarData, staff, jobs] = await Promise.all([
    getShiftCalendarData(startDate, endDate),
    getStaffMembers(),
    getRosterJobsWithTasks(),
  ]);

  return (
    <SchedulerClient
      initialYear={year}
      initialMonth={month}
      initialCalendarData={calendarData}
      staff={staff}
      jobs={jobs}
    />
  );
}
