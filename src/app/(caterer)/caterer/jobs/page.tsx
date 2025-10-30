import { CatererJobsClient } from "./_components/caterer-jobs-client";
import { getAssignedMealJobs } from "@/lib/queries/bookings";
import { enrichMealJobs } from "@/lib/catering";

const CATERER_NAME = "HCC Kitchen";

export default async function CatererJobsPage() {
  const jobs = await getAssignedMealJobs();
  const enrichedJobs = enrichMealJobs(jobs);
  return <CatererJobsClient jobs={enrichedJobs} catererName={CATERER_NAME} />;
}
