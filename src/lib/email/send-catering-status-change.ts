import { Resend } from "resend";
import { render } from "@react-email/render";
import { CateringStatusChangeEmail } from "@/emails/catering-status-change";
import { sbAdmin } from "@/lib/supabase-admin";
import { getBaseUrl } from "@/lib/config";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendCateringStatusChangeParams {
  mealJobId: string;
  recipientEmail: string;
  recipientName: string;
  catererName: string;
  groupName: string;
  mealType: string;
  newStatus: string;
  reason?: string;
  recipientRole: "admin" | "caterer";
}

export async function sendCateringStatusChange(params: SendCateringStatusChangeParams) {
  try {
    const portalUrl =
      params.recipientRole === "admin"
        ? `${getBaseUrl()}/admin/catering/jobs`
        : `${getBaseUrl()}/caterer/jobs`;

    const emailHtml = await render(
      CateringStatusChangeEmail({
        recipientName: params.recipientName,
        catererName: params.catererName,
        groupName: params.groupName,
        mealType: params.mealType,
        newStatus: params.newStatus,
        reason: params.reason,
        portalUrl,
      })
    );

    const { data, error } = await resend.emails.send({
      from: "HCC Catering <catering@resend.dev>",
      to: [params.recipientEmail],
      subject: `Job status update: ${params.mealType} for ${params.groupName} — ${params.newStatus}`,
      html: emailHtml,
    });

    if (error) {
      console.error("Failed to send catering status change email:", error);
      return { success: false, messageId: null };
    }

    const admin = sbAdmin();
    // @ts-ignore - catering_notifications not in generated types until migration is run
    await admin.from("catering_notifications").insert({
      meal_job_id: params.mealJobId,
      recipient_email: params.recipientEmail,
      notification_type: "status_change",
      subject: `Job status update: ${params.mealType} for ${params.groupName} — ${params.newStatus}`,
      resend_message_id: data?.id ?? null,
    });

    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error("Error sending catering status change email:", err);
    return { success: false, messageId: null };
  }
}
