// @ts-nocheck
"use server";

import { revalidatePath } from "next/cache";
import { revalidateTag } from "next/cache";
import { sbServer } from "@/lib/supabase-server";
import { sbAdmin } from "@/lib/supabase-admin";
import { CACHE_TAGS } from "@/lib/cache";
import { sendCateringComment } from "@/lib/email/send-catering-comment";
import { sendCateringStatusChange } from "@/lib/email/send-catering-status-change";

const CATERING_JOBS_PATH = "/admin/catering/jobs";
const CATERER_JOBS_PATH = "/caterer/jobs";

// --- Email notification helpers (fire-and-forget) ---

async function getAdminEmailsForNotification(): Promise<{ email: string; name: string }[]> {
  try {
    const admin = sbAdmin();
    const { data: admins } = await admin
      .from("profiles")
      .select("id, full_name")
      .eq("role", "admin");

    if (!admins?.length) return [];

    const results: { email: string; name: string }[] = [];
    for (const profile of admins) {
      const { data: { user } } = await admin.auth.admin.getUserById(profile.id);
      if (user?.email) {
        results.push({ email: user.email, name: profile.full_name ?? "Admin" });
      }
    }
    return results;
  } catch {
    return [];
  }
}

async function getMealJobEmailContext(mealJobId: string) {
  try {
    const admin = sbAdmin();
    const { data: job } = await admin
      .from("meal_jobs")
      .select("id, meal, group_name, booking_id, assigned_caterer_id, caterers(name, email)")
      .eq("id", mealJobId)
      .single();

    if (!job) return null;

    const groupName = job.group_name ?? (job.booking_id ? `Booking ${job.booking_id.slice(0, 8)}` : "Unknown Group");
    return {
      groupName,
      mealType: job.meal ?? "Meal",
      catererName: job.caterers?.name ?? "Caterer",
      catererEmail: job.caterers?.email ?? null,
      assignedCatererId: job.assigned_caterer_id,
    };
  } catch {
    return null;
  }
}

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

  // Fire-and-forget: notify the other party
  void (async () => {
    try {
      const ctx = await getMealJobEmailContext(mealJobId);
      if (!ctx) return;

      if (authorRole === "admin") {
        // Admin posted → notify assigned caterer
        if (ctx.catererEmail) {
          await sendCateringComment({
            mealJobId,
            recipientEmail: ctx.catererEmail,
            recipientName: ctx.catererName,
            authorName: profile.full_name ?? "Admin",
            authorRole: "admin",
            groupName: ctx.groupName,
            mealType: ctx.mealType,
            commentContent: content,
          });
        }
      } else {
        // Caterer posted → notify all admins
        const admins = await getAdminEmailsForNotification();
        for (const adm of admins) {
          await sendCateringComment({
            mealJobId,
            recipientEmail: adm.email,
            recipientName: adm.name,
            authorName: ctx.catererName,
            authorRole: "caterer",
            groupName: ctx.groupName,
            mealType: ctx.mealType,
            commentContent: content,
          });
        }
      }
    } catch (err) {
      console.error("Failed to send comment notification email:", err);
    }
  })();
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

  // Fire-and-forget: notify admins of confirmation
  void (async () => {
    try {
      const ctx = await getMealJobEmailContext(mealJobId);
      if (!ctx) return;
      const admins = await getAdminEmailsForNotification();
      for (const adm of admins) {
        await sendCateringStatusChange({
          mealJobId,
          recipientEmail: adm.email,
          recipientName: adm.name,
          catererName: ctx.catererName,
          groupName: ctx.groupName,
          mealType: ctx.mealType,
          newStatus: "Confirmed",
          recipientRole: "admin",
        });
      }
    } catch (err) {
      console.error("Failed to send confirm notification email:", err);
    }
  })();
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

  // Fire-and-forget: notify admins of decline
  void (async () => {
    try {
      const ctx = await getMealJobEmailContext(mealJobId);
      if (!ctx) return;
      const admins = await getAdminEmailsForNotification();
      for (const adm of admins) {
        await sendCateringStatusChange({
          mealJobId,
          recipientEmail: adm.email,
          recipientName: adm.name,
          catererName: ctx.catererName,
          groupName: ctx.groupName,
          mealType: ctx.mealType,
          newStatus: "Declined",
          reason: reason || undefined,
          recipientRole: "admin",
        });
      }
    } catch (err) {
      console.error("Failed to send decline notification email:", err);
    }
  })();
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

  // Fire-and-forget: notify admins of change request
  void (async () => {
    try {
      const ctx = await getMealJobEmailContext(mealJobId);
      if (!ctx) return;
      const admins = await getAdminEmailsForNotification();
      for (const adm of admins) {
        await sendCateringStatusChange({
          mealJobId,
          recipientEmail: adm.email,
          recipientName: adm.name,
          catererName: ctx.catererName,
          groupName: ctx.groupName,
          mealType: ctx.mealType,
          newStatus: "Changes Requested",
          reason: changeRequest || undefined,
          recipientRole: "admin",
        });
      }
    } catch (err) {
      console.error("Failed to send change request notification email:", err);
    }
  })();
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

// Admin creates a new catering job (linked or standalone)
export async function createCateringJob(data: {
  service_date: string;
  meal: string;
  group_name: string;
  counts_total: number;
  booking_id?: string | null;
  assigned_caterer_id?: string | null;
  counts_by_diet?: Record<string, number>;
  requested_service_time?: string | null;
}) {
  const supabase = await sbServer();
  const profile = await getCurrentProfile();
  if (!profile || !["admin", "staff"].includes(profile.role)) {
    throw new Error("Only admin/staff can create catering jobs");
  }

  const { error } = await supabase.from("meal_jobs").insert({
    service_date: data.service_date,
    meal: data.meal as any,
    group_name: data.group_name || null,
    booking_id: data.booking_id || null,
    counts_total: data.counts_total,
    counts_by_diet: data.counts_by_diet ?? {},
    assigned_caterer_id: data.assigned_caterer_id || null,
    status: data.assigned_caterer_id ? "Assigned" : "PendingAssignment",
    requested_service_time: data.requested_service_time || null,
    percolated_coffee: false,
    assignment_mode: "Manual",
    changes_requested: false,
  });

  if (error) throw new Error(`Failed to create catering job: ${error.message}`);

  revalidateTag(CACHE_TAGS.MEAL_JOBS);
  revalidatePath(CATERING_JOBS_PATH);
}

// Admin links an unlinked job to a booking
export async function linkJobToBooking(mealJobId: string, bookingId: string) {
  const supabase = await sbServer();
  const profile = await getCurrentProfile();
  if (!profile || !["admin", "staff"].includes(profile.role)) {
    throw new Error("Only admin/staff can link catering jobs");
  }

  const { error } = await supabase
    .from("meal_jobs")
    .update({ booking_id: bookingId, group_name: null })
    .eq("id", mealJobId);

  if (error) throw new Error(`Failed to link job: ${error.message}`);

  revalidateTag(CACHE_TAGS.MEAL_JOBS);
  revalidatePath(CATERING_JOBS_PATH);
}

// Admin deletes a catering job
export async function deleteCateringJob(mealJobId: string) {
  const supabase = await sbServer();
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    throw new Error("Only admins can delete catering jobs");
  }

  const { error } = await supabase.from("meal_jobs").delete().eq("id", mealJobId);
  if (error) throw new Error(`Failed to delete job: ${error.message}`);

  revalidateTag(CACHE_TAGS.MEAL_JOBS);
  revalidatePath(CATERING_JOBS_PATH);
}

// Admin updates serves count for a job
export async function updateJobServes(mealJobId: string, countsTotal: number) {
  const supabase = await sbServer();
  const profile = await getCurrentProfile();
  if (!profile || !["admin", "staff"].includes(profile.role)) {
    throw new Error("Only admin/staff can edit catering jobs");
  }

  const { error } = await supabase
    .from("meal_jobs")
    .update({ counts_total: countsTotal })
    .eq("id", mealJobId);

  if (error) throw new Error(`Failed to update serves: ${error.message}`);

  revalidateTag(CACHE_TAGS.MEAL_JOBS);
  revalidatePath(CATERING_JOBS_PATH);
}

// Admin updates menu items for a job
export async function updateJobMenuItems(mealJobId: string, menuItemIds: string[]) {
  const supabase = await sbServer();
  const profile = await getCurrentProfile();
  if (!profile || !["admin", "staff"].includes(profile.role)) {
    throw new Error("Only admin/staff can edit catering jobs");
  }

  // Delete then re-insert
  const { error: delError } = await supabase
    .from("meal_job_items")
    .delete()
    .eq("meal_job_id", mealJobId);

  if (delError) throw new Error(`Failed to clear menu items: ${delError.message}`);

  if (menuItemIds.length > 0) {
    const { error: insError } = await supabase.from("meal_job_items").insert(
      menuItemIds.map((id) => ({ meal_job_id: mealJobId, menu_item_id: id }))
    );
    if (insError) throw new Error(`Failed to insert menu items: ${insError.message}`);
  }

  revalidateTag(CACHE_TAGS.MEAL_JOBS);
  revalidatePath(CATERING_JOBS_PATH);
}

// Admin updates percolated coffee for a job
export async function updateJobCoffee(
  mealJobId: string,
  requested: boolean,
  quantity: number | null
) {
  const supabase = await sbServer();
  const profile = await getCurrentProfile();
  if (!profile || !["admin", "staff"].includes(profile.role)) {
    throw new Error("Only admin/staff can edit catering jobs");
  }

  const { error } = await supabase
    .from("meal_jobs")
    .update({
      percolated_coffee: requested,
      percolated_coffee_quantity: requested ? quantity : null,
    })
    .eq("id", mealJobId);

  if (error) throw new Error(`Failed to update coffee: ${error.message}`);

  revalidateTag(CACHE_TAGS.MEAL_JOBS);
  revalidatePath(CATERING_JOBS_PATH);
}

// Admin assigns caterer to a job (sends email)
export async function assignJobCaterer(mealJobId: string, catererId: string | null) {
  const supabase = await sbServer();
  const profile = await getCurrentProfile();
  if (!profile || !["admin", "staff"].includes(profile.role)) {
    throw new Error("Only admin/staff can assign caterers");
  }

  const { error } = await supabase
    .from("meal_jobs")
    .update({
      assigned_caterer_id: catererId || null,
      status: catererId ? "Assigned" : "PendingAssignment",
    })
    .eq("id", mealJobId);

  if (error) throw new Error(`Failed to assign caterer: ${error.message}`);

  revalidateTag(CACHE_TAGS.MEAL_JOBS);
  revalidatePath(CATERING_JOBS_PATH);
}

// Admin updates dietary counts for a job
export async function updateJobDietaryCounts(
  mealJobId: string,
  dietaryCounts: Record<string, number>
) {
  const supabase = await sbServer();
  const profile = await getCurrentProfile();
  if (!profile || !["admin", "staff"].includes(profile.role)) {
    throw new Error("Only admin/staff can edit catering jobs");
  }

  const { error } = await supabase
    .from("meal_jobs")
    .update({ counts_by_diet: dietaryCounts })
    .eq("id", mealJobId);

  if (error) throw new Error(`Failed to update dietary counts: ${error.message}`);

  revalidateTag(CACHE_TAGS.MEAL_JOBS);
  revalidatePath(CATERING_JOBS_PATH);
}

// Admin edits a catering job
export async function editCateringJob(
  mealJobId: string,
  data: {
    counts_total?: number;
    group_name?: string | null;
    requested_service_time?: string | null;
    assigned_caterer_id?: string | null;
    counts_by_diet?: Record<string, number>;
  }
) {
  const supabase = await sbServer();
  const profile = await getCurrentProfile();
  if (!profile || !["admin", "staff"].includes(profile.role)) {
    throw new Error("Only admin/staff can edit catering jobs");
  }

  const updateData: Record<string, any> = { ...data };
  if (data.assigned_caterer_id !== undefined) {
    updateData.status = data.assigned_caterer_id ? "Assigned" : "PendingAssignment";
  }

  const { error } = await supabase
    .from("meal_jobs")
    .update(updateData)
    .eq("id", mealJobId);

  if (error) throw new Error(`Failed to edit job: ${error.message}`);

  revalidateTag(CACHE_TAGS.MEAL_JOBS);
  revalidatePath(CATERING_JOBS_PATH);
}
