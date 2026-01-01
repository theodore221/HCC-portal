import { Metadata } from "next";

import { enrichMealJobs } from "@/lib/catering";
import {
  getBookingsForAdmin,
  getAssignedMealJobs,
} from "@/lib/queries/bookings.server";
import StaffKitchenClient from "./client";

export const metadata: Metadata = {
  title: "Kitchen",
};

export default async function StaffKitchenPage() {
  const [bookings, mealJobsRaw] = await Promise.all([
    getBookingsForAdmin(),
    getAssignedMealJobs(),
  ]);

  const jobs = enrichMealJobs(mealJobsRaw, bookings);

  return <StaffKitchenClient jobs={jobs} />;
}
