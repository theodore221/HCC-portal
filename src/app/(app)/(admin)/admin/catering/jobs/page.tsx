import { enrichMealJobs } from "@/lib/catering";
import {
  getAssignedMealJobs,
  getBookingsForAdmin,
  getCommentsForMealJobs,
} from "@/lib/queries/bookings.server";
import { getCateringOptions } from "@/lib/queries/catering.server";
import { sbServer } from "@/lib/supabase-server";
import AdminCateringJobsClient from "./client";

export default async function AdminCateringJobsPage() {
  const supabase = await sbServer();

  const [bookings, mealJobsRaw, cateringOptions, { data: dietaryLabels }] = await Promise.all([
    getBookingsForAdmin({ excludeCancelled: true }),
    getAssignedMealJobs(),
    getCateringOptions(),
    supabase
      .from("dietary_labels")
      .select("id, label, is_allergy")
      .eq("active", true)
      .order("sort_order"),
  ]);

  const jobs = enrichMealJobs(mealJobsRaw, bookings);

  const jobIds = jobs.map((j) => j.id);
  const commentsMap = await getCommentsForMealJobs(jobIds);

  return (
    <AdminCateringJobsClient
      jobs={jobs}
      commentsMap={commentsMap}
      caterers={cateringOptions.caterers}
      menuItems={cateringOptions.menuItems}
      dietaryLabels={dietaryLabels ?? []}
    />
  );
}
