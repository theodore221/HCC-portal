import { getUnavailabilityPeriods } from "@/lib/queries/rostering.server";
import { AdminUnavailabilityClient } from "./client";

export default async function AdminUnavailabilityPage() {
  const periods = await getUnavailabilityPeriods();
  return <AdminUnavailabilityClient periods={periods} />;
}
