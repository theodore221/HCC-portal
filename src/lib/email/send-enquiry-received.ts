import { Resend } from 'resend';
import { render } from '@react-email/render';
import { EnquiryReceivedEmail } from '@/emails/enquiry-received';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EnquiryData {
  reference_number: string;
  customer_name: string;
  customer_email: string;
  event_type: string;
  preferred_dates: string | null;
  message: string;
}

export async function sendEnquiryReceivedEmail(enquiry: EnquiryData) {
  const emailHtml = await render(
    EnquiryReceivedEmail({
      customerName: enquiry.customer_name,
      enquiryReference: enquiry.reference_number,
      eventType: enquiry.event_type,
      preferredDates: enquiry.preferred_dates || 'Not specified',
      message: enquiry.message,
    })
  );

  try {
    const { data, error } = await resend.emails.send({
      from: 'Holy Cross Centre <bookings@holycrosscentre.com.au>',
      to: [enquiry.customer_email],
      subject: `Enquiry Received: ${enquiry.reference_number}`,
      html: emailHtml,
    });

    if (error) {
      console.error('Failed to send enquiry confirmation email:', error);
      throw new Error(`Email sending failed: ${error.message}`);
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Error sending enquiry confirmation email:', error);
    throw error;
  }
}
