import { Resend } from 'resend';
import { render } from '@react-email/render';
import { CatererInvitationEmail } from '@/emails/caterer-invitation';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendCatererInvitationParams {
  catererName: string;
  catererEmail: string;
  magicLinkUrl: string;
}

export async function sendCatererInvitation({
  catererName,
  catererEmail,
  magicLinkUrl,
}: SendCatererInvitationParams) {
  const emailHtml = await render(
    CatererInvitationEmail({
      catererName,
      loginUrl: magicLinkUrl,
    })
  );

  try {
    const { data, error } = await resend.emails.send({
      from: 'Onboarding <onboarding@resend.dev>',
      to: [catererEmail],
      subject: 'Welcome to Holy Cross Centre Portal - Caterer Access',
      html: emailHtml,
    });

    if (error) {
      console.error('Failed to send caterer invitation email:', error);
      throw new Error(`Email sending failed: ${error.message}`);
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Error sending caterer invitation email:', error);
    throw error;
  }
}
