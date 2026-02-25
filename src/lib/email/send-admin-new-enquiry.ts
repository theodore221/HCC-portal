import { Resend } from 'resend';
import { render } from '@react-email/render';
import { AdminNewEnquiryEmail } from '@/emails/admin-new-enquiry';

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@holycrosscentre.com.au';
const SITE_URL = process.env.PUBLIC_SITE_URL || 'http://localhost:3000';

interface EnquiryData {
  id: string;
  reference_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  organization: string | null;
  event_type: string;
  approximate_start_date: string | null;
  approximate_end_date: string | null;
  estimated_guests: number | null;
  message: string;
}

export async function sendAdminNewEnquiryEmail(enquiry: EnquiryData) {
  const adminUrl = `${SITE_URL}/admin/enquiries/${enquiry.id}`;

  const emailHtml = await render(
    AdminNewEnquiryEmail({
      referenceNumber: enquiry.reference_number,
      customerName: enquiry.customer_name,
      customerEmail: enquiry.customer_email,
      customerPhone: enquiry.customer_phone,
      organization: enquiry.organization,
      eventType: enquiry.event_type,
      approximateStartDate: enquiry.approximate_start_date,
      approximateEndDate: enquiry.approximate_end_date,
      estimatedGuests: enquiry.estimated_guests,
      message: enquiry.message,
      adminUrl,
    })
  );

  const { data, error } = await resend.emails.send({
    from: 'Holy Cross Centre <bookings@holycrosscentre.com.au>',
    to: [ADMIN_EMAIL],
    subject: `New Enquiry: ${enquiry.reference_number} from ${enquiry.customer_name}`,
    html: emailHtml,
  });

  if (error) {
    console.error('Failed to send admin new enquiry email:', error);
    throw new Error(`Admin email sending failed: ${error.message}`);
  }

  return { success: true, messageId: data?.id };
}
