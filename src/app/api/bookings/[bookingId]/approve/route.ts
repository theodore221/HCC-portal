import { Resend } from "resend";

import { jsonError, jsonSuccess } from "@/server/api";
import { requirePortalSession } from "@/server/auth/require-portal-session";
import { approveBookingAndInviteCustomer } from "@/server/services/bookings";
import { BookingServiceError } from "@/server/services/booking-service-error";
import {
  BookingApprovedEmail,
  bookingApprovedPlainText,
  bookingApprovedSubject,
} from "@/server/emails/booking-approved";

export const POST = requirePortalSession(async (_request, { params }, auth) => {
  if (auth.profile.role !== "admin") {
    return jsonError("Forbidden", { status: 403 });
  }

  const rawBookingId = params.bookingId;
  const bookingId = Array.isArray(rawBookingId) ? rawBookingId[0] : rawBookingId;

  if (!bookingId) {
    return jsonError("A booking identifier is required.", { status: 400 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.error("RESEND_API_KEY is not configured. Unable to send approval email.");
    return jsonError("Email delivery is not configured.", { status: 500 });
  }

  try {
    const approval = await approveBookingAndInviteCustomer(bookingId);

    const resend = new Resend(resendApiKey);
    const reference = approval.booking.reference ?? approval.booking.id;
    const toAddress = approval.userEmail;

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "Hospitality Center <no-reply@resend.dev>",
      to: toAddress,
      subject: bookingApprovedSubject(reference),
      react: BookingApprovedEmail({
        customerName: approval.userName,
        bookingReference: reference,
        magicLink: approval.magicLink,
        arrivalDate: approval.booking.arrival_date,
        departureDate: approval.booking.departure_date,
        headcount: approval.booking.headcount,
      }),
      text: bookingApprovedPlainText({
        customerName: approval.userName,
        bookingReference: reference,
        magicLink: approval.magicLink,
        arrivalDate: approval.booking.arrival_date,
        departureDate: approval.booking.departure_date,
        headcount: approval.booking.headcount,
      }),
    });

    return jsonSuccess({ reference, email: toAddress });
  } catch (error) {
    if (error instanceof BookingServiceError) {
      return jsonError(error.message, { status: error.status });
    }

    console.error("Failed to approve booking", error);
    return jsonError("We were unable to approve this booking. Please try again later.", {
      status: 500,
    });
  }
});
