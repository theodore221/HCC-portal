import { getCurrentProfile } from "@/lib/auth/server";
import { getMyShifts } from "@/lib/queries/rostering.server";
import { redirect } from "next/navigation";
import { MyShiftsClient } from "./client";

export default async function MyShiftsPage() {
  const { profile } = await getCurrentProfile();
  if (!profile) redirect("/login");

  const shifts = await getMyShifts(profile.id);

  return <MyShiftsClient shifts={shifts} />;
}
