import * as React from "react";

export interface BookingConfirmationEmailProps {
  magicLinkUrl: string;
  reference: string;
  arrivalDate: string;
  departureDate: string;
  customerName?: string | null;
}

function formatDate(value: string) {
  try {
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) {
      return value;
    }

    return new Intl.DateTimeFormat("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(year, month - 1, day));
  } catch {
    return value;
  }
}

export function BookingConfirmationEmail({
  magicLinkUrl,
  reference,
  arrivalDate,
  departureDate,
  customerName,
}: BookingConfirmationEmailProps) {
  const greetingName = customerName?.trim() || "there";
  const formattedArrival = formatDate(arrivalDate);
  const formattedDeparture = formatDate(departureDate);

  return (
    <html>
      <body style={bodyStyle}>
        <table role="presentation" cellPadding="0" cellSpacing="0" style={wrapperStyle}>
          <tbody>
            <tr>
              <td style={contentStyle}>
                <p style={eyebrowStyle}>Booking reference</p>
                <h1 style={headingStyle}>{reference}</h1>
                <p style={paragraphStyle}>Hi {greetingName},</p>
                <p style={paragraphStyle}>
                  We&apos;re delighted to confirm your booking at the Holy Cross Centre. Use the
                  link below to secure your deposit, share dietary needs and manage your stay.
                </p>
                <p style={paragraphStyle}>
                  <a href={magicLinkUrl} style={buttonStyle}>
                    Open your booking portal
                  </a>
                </p>
                <table role="presentation" cellPadding="0" cellSpacing="0" style={detailsTableStyle}>
                  <tbody>
                    <tr>
                      <td style={detailsLabelStyle}>Arrival</td>
                      <td style={detailsValueStyle}>{formattedArrival}</td>
                    </tr>
                    <tr>
                      <td style={detailsLabelStyle}>Departure</td>
                      <td style={detailsValueStyle}>{formattedDeparture}</td>
                    </tr>
                  </tbody>
                </table>
                <p style={secondaryParagraphStyle}>
                  Can&apos;t click the button? Paste this link into your browser:<br />
                  <a href={magicLinkUrl} style={linkStyle}>
                    {magicLinkUrl}
                  </a>
                </p>
                <p style={paragraphStyle}>
                  Warm regards,<br />
                  The Holy Cross Centre team
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}

const bodyStyle: React.CSSProperties = {
  margin: 0,
  padding: "24px",
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  backgroundColor: "#f7f5f0",
};

const wrapperStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "640px",
  margin: "0 auto",
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  border: "1px solid #e3e7e0",
  overflow: "hidden",
};

const contentStyle: React.CSSProperties = {
  padding: "32px",
};

const eyebrowStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  fontSize: "12px",
  color: "#5c6b63",
  margin: 0,
};

const headingStyle: React.CSSProperties = {
  fontSize: "26px",
  margin: "8px 0 24px",
  color: "#2f3c33",
};

const paragraphStyle: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#37413a",
  margin: "16px 0",
};

const secondaryParagraphStyle: React.CSSProperties = {
  ...paragraphStyle,
  color: "#647060",
};

const buttonStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "14px 20px",
  backgroundColor: "#2f3c33",
  color: "#ffffff",
  textDecoration: "none",
  borderRadius: "10px",
  fontWeight: 600,
};

const linkStyle: React.CSSProperties = {
  color: "#1f7a4d",
  wordBreak: "break-all",
};

const detailsTableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  margin: "24px 0",
};

const detailsLabelStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#5c6b63",
  padding: "6px 0",
  width: "30%",
};

const detailsValueStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#2f3c33",
  padding: "6px 0",
  fontWeight: 600,
};
