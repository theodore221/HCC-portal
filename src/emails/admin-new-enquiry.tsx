import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from '@react-email/components';
import * as React from 'react';

interface AdminNewEnquiryEmailProps {
  referenceNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  organization: string | null;
  eventType: string;
  approximateStartDate: string | null;
  approximateEndDate: string | null;
  estimatedGuests: number | null;
  message: string;
  adminUrl: string;
}

export const AdminNewEnquiryEmail = ({
  referenceNumber,
  customerName,
  customerEmail,
  customerPhone,
  organization,
  eventType,
  approximateStartDate,
  approximateEndDate,
  estimatedGuests,
  message,
  adminUrl,
}: AdminNewEnquiryEmailProps) => {
  const previewText = `New enquiry ${referenceNumber} from ${customerName}`;

  const formatDate = (date: string | null) => {
    if (!date) return 'Not specified';
    return new Date(date).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const dateRange =
    approximateStartDate
      ? `${formatDate(approximateStartDate)}${approximateEndDate && approximateEndDate !== approximateStartDate ? ` → ${formatDate(approximateEndDate)}` : ''}`
      : 'Not specified';

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>New Enquiry Received</Heading>
          </Section>

          {/* Intro */}
          <Text style={text}>
            A new enquiry has been submitted via the Holy Cross Centre website.
          </Text>

          {/* Enquiry Details */}
          <Section style={detailsBox}>
            <Heading as="h2" style={h2}>Enquiry Details</Heading>
            <Hr style={hr} />

            <Row style={detailRow}>
              <Column style={detailLabel}>Reference:</Column>
              <Column style={detailValue}>{referenceNumber}</Column>
            </Row>

            <Row style={detailRow}>
              <Column style={detailLabel}>Name:</Column>
              <Column style={detailValue}>{customerName}</Column>
            </Row>

            <Row style={detailRow}>
              <Column style={detailLabel}>Email:</Column>
              <Column style={detailValue}>{customerEmail}</Column>
            </Row>

            {customerPhone && (
              <Row style={detailRow}>
                <Column style={detailLabel}>Phone:</Column>
                <Column style={detailValue}>{customerPhone}</Column>
              </Row>
            )}

            {organization && (
              <Row style={detailRow}>
                <Column style={detailLabel}>Organisation:</Column>
                <Column style={detailValue}>{organization}</Column>
              </Row>
            )}

            <Hr style={hr} />

            <Row style={detailRow}>
              <Column style={detailLabel}>Event Type:</Column>
              <Column style={detailValue}>{eventType}</Column>
            </Row>

            <Row style={detailRow}>
              <Column style={detailLabel}>Dates:</Column>
              <Column style={detailValue}>{dateRange}</Column>
            </Row>

            {estimatedGuests && (
              <Row style={detailRow}>
                <Column style={detailLabel}>Guests:</Column>
                <Column style={detailValue}>{estimatedGuests}</Column>
              </Row>
            )}

            <Hr style={hr} />

            <Text style={messageLabel}>Message:</Text>
            <Text style={messageBox}>{message}</Text>
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Button style={button} href={adminUrl}>
              View Enquiry in Admin
            </Button>
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Text style={footer}>
            Holy Cross Centre — Admin Notification<br />
            This email was sent automatically when a new enquiry was submitted.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default AdminNewEnquiryEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 40px',
  backgroundColor: '#2C5530',
  borderRadius: '8px 8px 0 0',
};

const h1 = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
  lineHeight: '1.2',
};

const h2 = {
  color: '#2C5530',
  fontSize: '20px',
  fontWeight: '600',
  margin: '0 0 12px',
};

const text = {
  color: '#333',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '16px 40px',
};

const detailsBox = {
  padding: '24px 40px',
  backgroundColor: '#f9fafb',
  margin: '24px 40px',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
};

const ctaSection = {
  padding: '0 40px 24px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#2C5530',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
};

const detailRow = {
  marginBottom: '8px',
};

const detailLabel = {
  color: '#6B7280',
  fontSize: '14px',
  width: '40%',
};

const detailValue = {
  color: '#111827',
  fontSize: '14px',
  fontWeight: '500',
};

const messageLabel = {
  color: '#6B7280',
  fontSize: '14px',
  margin: '8px 0 4px',
};

const messageBox = {
  color: '#111827',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
  padding: '12px',
  backgroundColor: '#ffffff',
  borderRadius: '6px',
  border: '1px solid #e5e7eb',
  whiteSpace: 'pre-wrap' as const,
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '16px 0',
};

const footer = {
  color: '#6B7280',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '8px 40px',
};
