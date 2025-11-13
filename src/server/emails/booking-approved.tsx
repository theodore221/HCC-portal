/* eslint-disable @next/next/no-head-element */
import * as React from "react";

type NullableDate = string | null;

export interface BookingApprovedEmailProps {
  customerName: string | null;
  bookingReference: string;
  magicLink: string;
  arrivalDate: NullableDate;
  departureDate: NullableDate;
  headcount: number | null;
}

function formatDateLabel(date: NullableDate) {
  if (!date) {
    return "Date TBC";
  }

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function BookingApprovedEmail({
  customerName,
  bookingReference,
  magicLink,
  arrivalDate,
  departureDate,
  headcount,
}: BookingApprovedEmailProps) {
  const greeting = customerName ? `Hi ${customerName},` : "Hello,";

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>Your booking is confirmed</title>
      </head>
      <body
        style={{
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          color: "#1F331D",
          margin: 0,
          padding: 0,
          backgroundColor: "#F9FBF8",
        }}
      >
        <table
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          role="presentation"
          style={{ maxWidth: 600, margin: "0 auto", padding: "32px 16px" }}
        >
          <tbody>
            <tr>
              <td>
                <table
                  width="100%"
                  cellPadding={0}
                  cellSpacing={0}
                  role="presentation"
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "16px",
                    padding: "32px",
                    boxShadow: "0 20px 45px rgba(19, 36, 13, 0.08)",
                  }}
                >
                  <tbody>
                    <tr>
                      <td style={{ fontSize: "16px", lineHeight: "24px" }}>
                        <p style={{ margin: "0 0 16px 0" }}>{greeting}</p>
                        <p style={{ margin: "0 0 16px 0" }}>
                          We&apos;re thrilled to confirm that your booking <strong>{bookingReference}</strong> has
                          been approved. You can review the details and share documents with our team by visiting
                          your booking portal.
                        </p>
                        <p style={{ margin: "0 0 24px 0" }}>
                          <a
                            href={magicLink}
                            style={{
                              display: "inline-block",
                              padding: "12px 24px",
                              backgroundColor: "#3B6B35",
                              color: "#FFFFFF",
                              borderRadius: "999px",
                              textDecoration: "none",
                              fontWeight: 600,
                            }}
                          >
                            Open your booking portal
                          </a>
                        </p>
                        <table
                          width="100%"
                          role="presentation"
                          cellPadding={0}
                          cellSpacing={0}
                          style={{
                            backgroundColor: "#F1F7F0",
                            borderRadius: "12px",
                            padding: "16px",
                            marginBottom: "24px",
                          }}
                        >
                          <tbody>
                            <tr>
                              <td style={{ fontSize: "14px", lineHeight: "20px" }}>
                                <p style={{ margin: "0 0 8px 0", fontWeight: 600 }}>Booking summary</p>
                                <p style={{ margin: "0 0 4px 0" }}>
                                  Arrival: <strong>{formatDateLabel(arrivalDate)}</strong>
                                </p>
                                <p style={{ margin: "0 0 4px 0" }}>
                                  Departure: <strong>{formatDateLabel(departureDate)}</strong>
                                </p>
                                <p style={{ margin: 0 }}>
                                  Guests: <strong>{headcount ?? "To be confirmed"}</strong>
                                </p>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <p style={{ margin: "0 0 12px 0" }}>
                          If you have any questions or need to make changes, simply reply to this email and our team
                          will be happy to help.
                        </p>
                        <p style={{ margin: 0 }}>We look forward to welcoming you soon!</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}

export function bookingApprovedSubject(reference: string) {
  return `Your booking ${reference} is confirmed`;
}

export function bookingApprovedPlainText({
  customerName,
  bookingReference,
  magicLink,
  arrivalDate,
  departureDate,
  headcount,
}: BookingApprovedEmailProps) {
  const greeting = customerName ? `Hi ${customerName},` : "Hello,";
  const arrivalLabel = formatDateLabel(arrivalDate);
  const departureLabel = formatDateLabel(departureDate);
  const guestLabel = headcount ?? "To be confirmed";

  return [
    greeting,
    "",
    `We're thrilled to confirm that your booking ${bookingReference} has been approved.`,
    "Use the link below to access your booking portal:",
    magicLink,
    "",
    "Booking summary:",
    `Arrival: ${arrivalLabel}`,
    `Departure: ${departureLabel}`,
    `Guests: ${guestLabel}`,
    "",
    "If you have any questions, reply to this email and our team will assist you.",
    "",
    "We look forward to welcoming you soon!",
  ].join("\n");
}
