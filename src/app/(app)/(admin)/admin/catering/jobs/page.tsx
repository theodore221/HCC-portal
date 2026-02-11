import { enrichMealJobs } from "@/lib/catering";
import {
  getAssignedMealJobs,
  getBookingsForAdmin,
  getCommentsForMealJobs,
} from "@/lib/queries/bookings.server";
import { getCateringOptions } from "@/lib/queries/catering.server";
import AdminCateringJobsClient from "./client";

export default async function AdminCateringJobsPage() {
  const [bookings, mealJobsRaw, cateringOptions] = await Promise.all([
    getBookingsForAdmin({ excludeCancelled: true }),
    getAssignedMealJobs(),
    getCateringOptions(),
  ]);
  const jobs = enrichMealJobs(mealJobsRaw, bookings);

  // Fetch comments for all jobs
  const jobIds = jobs.map((j) => j.id);
  const commentsMap = await getCommentsForMealJobs(jobIds);

  return (
    <AdminCateringJobsClient
      jobs={jobs}
      commentsMap={commentsMap}
      caterers={cateringOptions.caterers}
      menuItems={cateringOptions.menuItems}
    />
  );
}
