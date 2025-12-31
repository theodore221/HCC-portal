// @ts-nocheck
"use server";

import { revalidatePath } from "next/cache";
import { sbServer } from "@/lib/supabase-server";

const CATERING_JOBS_PATH = "/admin/catering/jobs";
const CATERER_JOBS_PATH = "/caterer/jobs";

async function getCurrentProfile() {
  const supabase = await sbServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role, caterer_id, full_name")
    .eq("id", user.id)
    .single();

  if (error) throw new Error(`Failed to load profile: ${error.message}`);
  return profile;
}

// Add comment to a meal job
export async function addMealJobComment(mealJobId: string, content: string) {
  const supabase = await sbServer();
  const profile = await getCurrentProfile();

  if (!profile) throw new Error("Not authenticated");

  const authorRole =
    profile.role === "caterer" ? "caterer" : ("admin" as const);

  const { error } = await supabase.from("meal_job_comments").insert({
    meal_job_id: mealJobId,
    author_id: profile.id,
    author_role: authorRole,
    content,
  });

  if (error) throw new Error(`Failed to add comment: ${error.message}`);

  revalidatePath(CATERING_JOBS_PATH);
  revalidatePath(CATERER_JOBS_PATH);
}

// Caterer confirms a job
export async function confirmMealJob(mealJobId: string) {
  const supabase = await sbServer();
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "caterer") {
    throw new Error("Only caterers can confirm jobs");
  }

  const { error } = await supabase
    .from("meal_jobs")
    .update({
      status: "Confirmed",
      changes_requested: false,
    })
    .eq("id", mealJobId)
    .eq("assigned_caterer_id", profile.caterer_id); // Security: only own jobs

  if (error) throw new Error(`Failed to confirm job: ${error.message}`);

  revalidatePath(CATERER_JOBS_PATH);
  revalidatePath(CATERING_JOBS_PATH);
}

// Caterer declines a job
export async function declineMealJob(mealJobId: string, reason: string) {
  const supabase = await sbServer();
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "caterer") {
    throw new Error("Only caterers can decline jobs");
  }

  // First update the job status
  const { error: updateError } = await supabase
    .from("meal_jobs")
    .update({
      status: "PendingAssignment",
      assigned_caterer_id: null,
      changes_requested: false,
    })
    .eq("id", mealJobId)
    .eq("assigned_caterer_id", profile.caterer_id);

  if (updateError)
    throw new Error(`Failed to decline job: ${updateError.message}`);

  // Add a comment with the decline reason
  if (reason) {
    await supabase.from("meal_job_comments").insert({
      meal_job_id: mealJobId,
      author_id: profile.id,
      author_role: "caterer",
      content: `Declined assignment: ${reason}`,
    });
  }

  revalidatePath(CATERER_JOBS_PATH);
  revalidatePath(CATERING_JOBS_PATH);
}

// Caterer requests changes
export async function requestMealJobChanges(
  mealJobId: string,
  changeRequest: string
) {
  const supabase = await sbServer();
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "caterer") {
    throw new Error("Only caterers can request changes");
  }

  // Set the changes_requested flag
  const { error: updateError } = await supabase
    .from("meal_jobs")
    .update({
      changes_requested: true,
    })
    .eq("id", mealJobId)
    .eq("assigned_caterer_id", profile.caterer_id);

  if (updateError)
    throw new Error(`Failed to request changes: ${updateError.message}`);

  // Add the change request as a comment
  await supabase.from("meal_job_comments").insert({
    meal_job_id: mealJobId,
    author_id: profile.id,
    author_role: "caterer",
    content: `Change requested: ${changeRequest}`,
  });

  revalidatePath(CATERER_JOBS_PATH);
  revalidatePath(CATERING_JOBS_PATH);
}

// Admin clears change request flag (after addressing)
export async function clearChangeRequest(mealJobId: string) {
  const supabase = await sbServer();
  const profile = await getCurrentProfile();

  if (!profile || !["admin", "staff"].includes(profile.role)) {
    throw new Error("Only admin/staff can clear change requests");
  }

  const { error } = await supabase
    .from("meal_jobs")
    .update({ changes_requested: false })
    .eq("id", mealJobId);

  if (error)
    throw new Error(`Failed to clear change request: ${error.message}`);

  revalidatePath(CATERER_JOBS_PATH);
  revalidatePath(CATERING_JOBS_PATH);
}
