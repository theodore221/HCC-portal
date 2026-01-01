import { Metadata } from "next";

import { enrichMealJobs } from "@/lib/catering";
import {
  getBookingsForAdmin,
  getCommentsForMealJobs,
  getMealJobsForCurrentCaterer,
} from "@/lib/queries/bookings.server";
import { getCateringOptions } from "@/lib/queries/catering.server";
import CatererJobsClient from "./client";

export const metadata: Metadata = {
  title: "Caterer Jobs",
};

export default async function CatererJobsPage() {
  const [bookings, mealJobsRaw, cateringOptions] = await Promise.all([
    getBookingsForAdmin(),
    getMealJobsForCurrentCaterer(),
    getCateringOptions(),
  ]);

  const jobs = enrichMealJobs(mealJobsRaw, bookings);

  // Fetch comments for jobs
  const jobIds = jobs.map((j) => j.id);
  const commentsMap = await getCommentsForMealJobs(jobIds);

  return (
    <CatererJobsClient
      jobs={jobs}
      commentsMap={commentsMap}
      caterers={cateringOptions.caterers}
      menuItems={cateringOptions.menuItems}
    />
  );
}
