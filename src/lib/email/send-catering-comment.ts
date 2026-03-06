import { Resend } from "resend";
import { render } from "@react-email/render";
import { CateringCommentNotificationEmail } from "@/emails/catering-comment-notification";
import { sbAdmin } from "@/lib/supabase-admin";
import { getBaseUrl } from "@/lib/config";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendCateringCommentParams {
  mealJobId: string;
  recipientEmail: string;
  recipientName: string;
  authorName: string;
  authorRole: "admin" | "caterer";
  groupName: string;
  mealType: string;
  commentContent: string;
}

export async function sendCateringComment(params: SendCateringCommentParams) {
  try {
    const portalUrl =
      params.authorRole === "caterer"
        ? `${getBaseUrl()}/admin/catering/jobs`
        : `${getBaseUrl()}/caterer/jobs`;

    const emailHtml = await render(
      CateringCommentNotificationEmail({
        recipientName: params.recipientName,
        authorName: params.authorName,
        authorRole: params.authorRole,
        groupName: params.groupName,
        mealType: params.mealType,
        commentContent: params.commentContent,
        portalUrl,
      })
    );

    const { data, error } = await resend.emails.send({
      from: "HCC Catering <catering@resend.dev>",
      to: [params.recipientEmail],
      subject: `New comment on ${params.mealType} job for ${params.groupName}`,
      html: emailHtml,
    });

    if (error) {
      console.error("Failed to send catering comment email:", error);
      return { success: false, messageId: null };
    }

    const admin = sbAdmin();
    // @ts-ignore - catering_notifications not in generated types until migration is run
    await admin.from("catering_notifications").insert({
      meal_job_id: params.mealJobId,
      recipient_email: params.recipientEmail,
      notification_type: "comment",
      subject: `New comment on ${params.mealType} job for ${params.groupName}`,
      resend_message_id: data?.id ?? null,
    });

    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error("Error sending catering comment email:", err);
    return { success: false, messageId: null };
  }
}
