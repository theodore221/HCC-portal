"use client";

import { ScheduleClient } from "@/components/schedule/schedule-client";
import type { ScheduleRow } from "@/lib/queries/schedule.server";

interface ScheduleClientProps {
  data: ScheduleRow[];
}

export default function AdminScheduleClient({ data }: ScheduleClientProps) {
  return <ScheduleClient data={data} basePath="/admin" />;
}
