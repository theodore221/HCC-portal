import { Resend } from 'resend';
import { render } from '@react-email/render';
import { BookingApprovedEmail } from '@/emails/booking-approved';

const resend = new Resend(process.env.RESEND_API_KEY);

interface BookingData {
  id: string;
  reference: string | null;
  customer_email: string;
  customer_name: string | null;
  contact_name: string | null;
  arrival_date: string;
  departure_date: string;
  headcount: number;
}

interface SendBookingApprovedEmailParams {
  booking: BookingData;
  spaces?: string[];
  accommodationSummary?: {
    doubleBB: number;
    singleBB: number;
    studySuite: number;
    doubleEnsuite: number;
  };
  cateringSummary?: {
    totalMeals: number;
  };
}

export async function sendBookingApprovedEmail({
  booking,
  spaces = [],
  accommodationSummary,
  cateringSummary,
}: SendBookingApprovedEmailParams) {
  const portalUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/portal/${
    booking.reference || booking.id
  }`;

  const emailHtml = await render(
    BookingApprovedEmail({
      customerName:
        booking.customer_name || booking.contact_name || 'Valued Customer',
      bookingReference: booking.reference || booking.id,
      arrivalDate: new Date(booking.arrival_date).toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      departureDate: new Date(booking.departure_date).toLocaleDateString(
        'en-AU',
        {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }
      ),
      headcount: booking.headcount,
      portalUrl,
      spaces,
      accommodationSummary,
      cateringSummary,
    })
  );

  try {
    const { data, error } = await resend.emails.send({
      from: 'Onboarding <onboarding@resend.dev>',
      to: [booking.customer_email],
      subject: `Booking Confirmed: ${booking.reference || booking.id}`,
      html: emailHtml,
    });

    if (error) {
      console.error('Failed to send booking approval email:', error);
      throw new Error(`Email sending failed: ${error.message}`);
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Error sending booking approval email:', error);
    throw error;
  }
}
