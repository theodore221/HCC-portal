import { Resend } from 'resend';
import { render } from '@react-email/render';
import { CustomBookingLinkEmail } from '@/emails/custom-booking-link';

const resend = new Resend(process.env.RESEND_API_KEY);

interface CustomBookingLinkData {
  customer_name: string;
  customer_email: string;
  reference: string | null;
  booking_url: string;
  expires_at: string;
  discount_percentage?: number;
  custom_pricing_notes?: string;
}

export async function sendCustomBookingLinkEmail(data: CustomBookingLinkData) {
  const expiryDate = new Date(data.expires_at).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const emailHtml = await render(
    CustomBookingLinkEmail({
      customerName: data.customer_name,
      bookingReference: data.reference || 'Pending',
      bookingUrl: data.booking_url,
      expiryDate,
      discountPercentage: data.discount_percentage,
      customPricingNotes: data.custom_pricing_notes,
    })
  );

  try {
    const { data: emailData, error } = await resend.emails.send({
      from: 'Holy Cross Centre <bookings@holycrosscentre.com.au>',
      to: [data.customer_email],
      subject: `Your Personal Booking Link - Holy Cross Centre`,
      html: emailHtml,
    });

    if (error) {
      console.error('Failed to send custom booking link email:', error);
      throw new Error(`Email sending failed: ${error.message}`);
    }

    return { success: true, messageId: emailData?.id };
  } catch (error) {
    console.error('Error sending custom booking link email:', error);
    throw error;
  }
}
