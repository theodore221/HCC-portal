import { enrichMealJobs } from "@/lib/catering";
import { getAssignedMealJobs, getBookingsForAdmin } from "@/lib/queries/bookings.server";
import AdminCateringJobsClient from "./client";

export default async function AdminCateringJobsPage() {
  const [bookings, mealJobsRaw] = await Promise.all([
    getBookingsForAdmin(),
    getAssignedMealJobs(),
  ]);
  const jobs = enrichMealJobs(mealJobsRaw, bookings);

  return <AdminCateringJobsClient jobs={jobs} />;
}
