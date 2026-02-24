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

interface EnquiryReceivedEmailProps {
  customerName: string;
  enquiryReference: string;
  eventType: string;
  preferredDates: string;
  message: string;
}

export const EnquiryReceivedEmail = ({
  customerName,
  enquiryReference,
  eventType,
  preferredDates,
  message,
}: EnquiryReceivedEmailProps) => {
  const previewText = `Thank you for your enquiry to Holy Cross Centre`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>Enquiry Received</Heading>
          </Section>

          {/* Main Content */}
          <Text style={text}>Dear {customerName},</Text>
          <Text style={text}>
            Thank you for your enquiry to Holy Cross Centre. We&apos;ve received your request and
            will get back to you shortly with more information.
          </Text>

          {/* Enquiry Details */}
          <Section style={detailsBox}>
            <Heading as="h2" style={h2}>Your Enquiry Details</Heading>
            <Hr style={hr} />

            <Row style={detailRow}>
              <Column style={detailLabel}>Reference:</Column>
              <Column style={detailValue}>{enquiryReference}</Column>
            </Row>

            <Row style={detailRow}>
              <Column style={detailLabel}>Event Type:</Column>
              <Column style={detailValue}>{eventType}</Column>
            </Row>

            <Row style={detailRow}>
              <Column style={detailLabel}>Preferred Dates:</Column>
              <Column style={detailValue}>{preferredDates}</Column>
            </Row>

            <Hr style={hr} />
            <Text style={messageBox}>
              <strong>Your Message:</strong><br />
              {message}
            </Text>
          </Section>

          {/* Next Steps */}
          <Section style={nextStepsBox}>
            <Heading as="h2" style={h2}>What Happens Next?</Heading>
            <Text style={text}>
              Our team will review your enquiry and respond within 1-2 business days. We&apos;ll provide:
            </Text>
            <ul style={list}>
              <li style={listItem}>Availability for your preferred dates</li>
              <li style={listItem}>Pricing information</li>
              <li style={listItem}>Details about our facilities and services</li>
              <li style={listItem}>Next steps for booking</li>
            </ul>
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Text style={footer}>
            If you have any urgent questions, please don&apos;t hesitate to contact us directly.
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

export default EnquiryReceivedEmail;

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

const messageBox = {
  color: '#111827',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '12px 0',
  padding: '12px',
  backgroundColor: '#ffffff',
  borderRadius: '6px',
  border: '1px solid #e5e7eb',
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
