import { getCurrentProfile } from "@/lib/auth/server";
import { getMyShifts } from "@/lib/queries/rostering.server";
import { redirect } from "next/navigation";
import { MyShiftsClient } from "@/app/(app)/(staff)/staff/rostering/my-shifts/client";

export default async function AdminMyShiftsPage() {
  const { profile } = await getCurrentProfile();
  if (!profile) redirect("/login");

  const shifts = await getMyShifts(profile.id);

  return <MyShiftsClient shifts={shifts} />;
}
