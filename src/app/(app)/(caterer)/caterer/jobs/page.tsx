import { Metadata } from "next";

import { enrichMealJobs } from "@/lib/catering";
import {
  getBookingsForAdmin,
  getCommentsForMealJobs,
  getMealJobsForCurrentCaterer,
} from "@/lib/queries/bookings.server";
import CatererJobsClient from "./client";

export const metadata: Metadata = {
  title: "Caterer Jobs",
};

export default async function CatererJobsPage() {
  const [bookings, mealJobsRaw] = await Promise.all([
    getBookingsForAdmin(),
    getMealJobsForCurrentCaterer(),
  ]);

  const jobs = enrichMealJobs(mealJobsRaw, bookings);

  // Fetch comments for jobs
  const jobIds = jobs.map((j) => j.id);
  const commentsMap = await getCommentsForMealJobs(jobIds);

  return <CatererJobsClient jobs={jobs} commentsMap={commentsMap} />;
}
