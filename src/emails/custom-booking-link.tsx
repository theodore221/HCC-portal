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

interface CustomBookingLinkEmailProps {
  customerName: string;
  bookingReference: string;
  bookingUrl: string;
  expiryDate: string;
  discountPercentage?: number;
  customPricingNotes?: string;
}

export const CustomBookingLinkEmail = ({
  customerName,
  bookingReference,
  bookingUrl,
  expiryDate,
  discountPercentage,
  customPricingNotes,
}: CustomBookingLinkEmailProps) => {
  const previewText = `Your personalized booking link for Holy Cross Centre`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>Your Personal Booking Link</Heading>
          </Section>

          {/* Main Content */}
          <Text style={text}>Dear {customerName},</Text>
          <Text style={text}>
            We've created a personalized booking link for you at Holy Cross Centre.
            {discountPercentage && discountPercentage > 0 && (
              <> This link includes special pricing just for you.</>
            )}
          </Text>

          {/* Special Pricing Banner */}
          {discountPercentage && discountPercentage > 0 && (
            <Section style={discountBanner}>
              <Heading as="h3" style={discountHeading}>
                🎉 Special Pricing: {discountPercentage}% Discount
              </Heading>
              {customPricingNotes && (
                <Text style={discountText}>{customPricingNotes}</Text>
              )}
            </Section>
          )}

          {/* Link Details */}
          <Section style={detailsBox}>
            <Heading as="h2" style={h2}>Booking Link Details</Heading>
            <Hr style={hr} />

            <Row style={detailRow}>
              <Column style={detailLabel}>Reference:</Column>
              <Column style={detailValue}>{bookingReference}</Column>
            </Row>

            <Row style={detailRow}>
              <Column style={detailLabel}>Link Expires:</Column>
              <Column style={detailValue}>{expiryDate}</Column>
            </Row>

            <Row style={detailRow}>
              <Column style={detailLabel}>Usage:</Column>
              <Column style={detailValue}>Single-use (link will expire after submission)</Column>
            </Row>
          </Section>

          {/* CTA Button */}
          <Section style={buttonContainer}>
            <Button style={button} href={bookingUrl}>
              Complete Your Booking
            </Button>
          </Section>

          {/* Next Steps */}
          <Section style={nextStepsBox}>
            <Heading as="h2" style={h2}>How It Works</Heading>
            <ul style={list}>
              <li style={listItem}>Click the button above to access your personalized booking form</li>
              <li style={listItem}>Your contact details are already filled in</li>
              <li style={listItem}>Complete the event details and preferences</li>
              <li style={listItem}>Submit your booking for review</li>
            </ul>
            <Text style={importantText}>
              <strong>Important:</strong> This link can only be used once and expires in 30 days.
              Please complete your booking before {expiryDate}.
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Text style={footer}>
            If you have any questions or need assistance, please don't hesitate to contact us.
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

export default CustomBookingLinkEmail;

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

const discountBanner = {
  padding: '20px 40px',
  margin: '24px 40px',
  backgroundColor: '#dcfce7',
  borderRadius: '8px',
  border: '2px solid #86efac',
  textAlign: 'center' as const,
};

const discountHeading = {
  color: '#166534',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 8px',
};

const discountText = {
  color: '#166534',
  fontSize: '14px',
  margin: '0',
  fontStyle: 'italic',
};

const text = {
  color: '#333',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '16px 40px',
};

const importantText = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '16px 40px',
  padding: '12px 16px',
  backgroundColor: '#fef3c7',
  borderRadius: '6px',
  border: '1px solid #fbbf24',
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

const buttonContainer = {
  padding: '24px 40px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#2C5530',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
};

const footer = {
  color: '#6B7280',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '8px 40px',
};
