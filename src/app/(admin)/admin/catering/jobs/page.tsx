import { AdminCateringJobsClient } from "./_components/admin-catering-jobs-client";
import { getAssignedMealJobs } from "@/lib/queries/bookings";
import { enrichMealJobs } from "@/lib/catering";

export default async function AdminCateringJobsPage() {
  const jobs = await getAssignedMealJobs();
  const enrichedJobs = enrichMealJobs(jobs);
  return <AdminCateringJobsClient jobs={enrichedJobs} />;
}
