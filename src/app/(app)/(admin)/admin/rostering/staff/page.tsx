import { getStaffMembers } from "@/lib/queries/rostering.server";
import { StaffClient } from "./client";

export default async function StaffPage() {
  const staff = await getStaffMembers();
  return <StaffClient staff={staff} />;
}
