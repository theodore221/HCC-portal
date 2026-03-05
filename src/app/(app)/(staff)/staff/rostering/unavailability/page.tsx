import { getCurrentProfile } from "@/lib/auth/server";
import { getMyUnavailabilityPeriods, getMyWeeklyUnavailability } from "@/lib/queries/rostering.server";
import { redirect } from "next/navigation";
import { StaffUnavailabilityClient } from "./client";

export default async function StaffUnavailabilityPage() {
  const { profile } = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [periods, weeklyRows] = await Promise.all([
    getMyUnavailabilityPeriods(profile.id),
    getMyWeeklyUnavailability(profile.id),
  ]);

  return <StaffUnavailabilityClient periods={periods} weeklyRows={weeklyRows} />;
}
