import type { Metadata } from "next";

import { getScheduleData } from "@/lib/queries/schedule.server";
import ScheduleClient from "./client";

export const metadata: Metadata = {
  title: "Schedule",
  description: "At-a-glance view of all incoming groups and bookings.",
};

export default async function StaffSchedulePage() {
  const scheduleData = await getScheduleData();
  return <ScheduleClient data={scheduleData} />;
}
