import { Resend } from 'resend';
import { render } from '@react-email/render';
import { BookingSubmittedEmail } from '@/emails/booking-submitted';

const resend = new Resend(process.env.RESEND_API_KEY);

interface BookingData {
  reference: string | null;
  customer_name: string | null;
  customer_email: string;
  arrival_date: string;
  departure_date: string;
  headcount: number;
}

export async function sendBookingSubmittedEmail(booking: BookingData) {
  const emailHtml = await render(
    BookingSubmittedEmail({
      customerName: booking.customer_name || 'Valued Customer',
      bookingReference: booking.reference || 'Pending',
      arrivalDate: new Date(booking.arrival_date).toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      departureDate: new Date(booking.departure_date).toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      headcount: booking.headcount,
    })
  );

  try {
    const { data, error } = await resend.emails.send({
      from: 'Holy Cross Centre <bookings@holycrosscentre.com.au>',
      to: [booking.customer_email],
      subject: `Booking Request Received: ${booking.reference || 'Pending'}`,
      html: emailHtml,
    });

    if (error) {
      console.error('Failed to send booking submission confirmation email:', error);
      throw new Error(`Email sending failed: ${error.message}`);
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Error sending booking submission confirmation email:', error);
    throw error;
  }
}
