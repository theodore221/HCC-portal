import {
  Body,
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

interface BookingSubmittedEmailProps {
  customerName: string;
  bookingReference: string;
  arrivalDate: string;
  departureDate: string;
  headcount: number;
}

export const BookingSubmittedEmail = ({
  customerName,
  bookingReference,
  arrivalDate,
  departureDate,
  headcount,
}: BookingSubmittedEmailProps) => {
  const previewText = `Your booking request ${bookingReference} has been received`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>Booking Request Received</Heading>
          </Section>

          {/* Main Content */}
          <Text style={text}>Dear {customerName},</Text>
          <Text style={text}>
            Thank you for submitting your booking request to Holy Cross Centre.
            We've received your request and it's now under review.
          </Text>

          {/* Booking Details */}
          <Section style={detailsBox}>
            <Heading as="h2" style={h2}>Your Booking Details</Heading>
            <Hr style={hr} />

            <Row style={detailRow}>
              <Column style={detailLabel}>Reference:</Column>
              <Column style={detailValue}>{bookingReference}</Column>
            </Row>

            <Row style={detailRow}>
              <Column style={detailLabel}>Dates:</Column>
              <Column style={detailValue}>{arrivalDate} to {departureDate}</Column>
            </Row>

            <Row style={detailRow}>
              <Column style={detailLabel}>Guests:</Column>
              <Column style={detailValue}>{headcount} people</Column>
            </Row>
          </Section>

          {/* Next Steps */}
          <Section style={nextStepsBox}>
            <Heading as="h2" style={h2}>What Happens Next?</Heading>
            <Text style={text}>
              Our team will review your booking request and check availability. You can expect:
            </Text>
            <ul style={list}>
              <li style={listItem}>Review of your booking within 1-2 business days</li>
              <li style={listItem}>Email notification once approved</li>
              <li style={listItem}>Access to your customer portal to manage room and meal selections</li>
              <li style={listItem}>Invoice and payment details</li>
            </ul>
            <Text style={text}>
              We'll send you another email once your booking has been approved or if we need
              any additional information.
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Text style={footer}>
            If you have any questions about your booking, please quote reference <strong>{bookingReference}</strong>.
          </Text>
          <Text style={footer}>
            Holy Cross Centre<br />
            Phone: (Contact number here)<br />
            Email: info@holycrosscentre.com.au
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default BookingSubmittedEmail;

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

const nextStepsBox = {
  padding: '0 40px',
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

const list = {
  paddingLeft: '20px',
  margin: '8px 0',
};

const listItem = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '24px',
  marginBottom: '4px',
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
