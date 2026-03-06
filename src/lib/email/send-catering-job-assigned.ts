import { Resend } from "resend";
import { render } from "@react-email/render";
import { CateringJobAssignedEmail } from "@/emails/catering-job-assigned";
import { sbAdmin } from "@/lib/supabase-admin";

const resend = new Resend(process.env.RESEND_API_KEY);
const BASE_URL = process.env.PUBLIC_SITE_URL ?? "http://localhost:3000";

interface SendCateringJobAssignedParams {
  mealJobId: string;
  catererEmail: string;
  catererName: string;
  groupName: string;
  mealType: string;
  serviceDate: string;
  headcount: number;
}

export async function sendCateringJobAssigned(params: SendCateringJobAssignedParams) {
  try {
    const emailHtml = await render(
      CateringJobAssignedEmail({
        catererName: params.catererName,
        groupName: params.groupName,
        mealType: params.mealType,
        serviceDate: params.serviceDate,
        headcount: params.headcount,
        portalUrl: `${BASE_URL}/caterer/jobs`,
      })
    );

    const { data, error } = await resend.emails.send({
      from: "HCC Catering <catering@resend.dev>",
      to: [params.catererEmail],
      subject: `New catering job: ${params.mealType} for ${params.groupName}`,
      html: emailHtml,
    });

    if (error) {
      console.error("Failed to send catering job assigned email:", error);
      return { success: false, messageId: null };
    }

    // Audit trail
    const admin = sbAdmin();
    // @ts-ignore - catering_notifications not in generated types until migration is run
    await admin.from("catering_notifications").insert({
      meal_job_id: params.mealJobId,
      recipient_email: params.catererEmail,
      notification_type: "job_assigned",
      subject: `New catering job: ${params.mealType} for ${params.groupName}`,
      resend_message_id: data?.id ?? null,
    });

    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error("Error sending catering job assigned email:", err);
    return { success: false, messageId: null };
  }
}
