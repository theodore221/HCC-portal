import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from '@react-email/components';
import * as React from 'react';

interface BookingApprovedEmailProps {
  customerName: string;
  bookingReference: string;
  arrivalDate: string;
  departureDate: string;
  headcount: number;
  portalUrl: string;
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

export const BookingApprovedEmail = ({
  customerName,
  bookingReference,
  arrivalDate,
  departureDate,
  headcount,
  portalUrl,
  spaces = [],
  accommodationSummary,
  cateringSummary,
}: BookingApprovedEmailProps) => {
  const previewText = `Your booking ${bookingReference} has been approved!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>Booking Approved!</Heading>
          </Section>

          {/* Main Content */}
          <Text style={text}>Dear {customerName},</Text>
          <Text style={text}>
            Great news! Your booking at Holy Cross Centre has been approved and confirmed.
          </Text>

          {/* Booking Details */}
          <Section style={detailsBox}>
            <Heading as="h2" style={h2}>Booking Details</Heading>
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

            {spaces.length > 0 && (
              <Row style={detailRow}>
                <Column style={detailLabel}>Spaces:</Column>
                <Column style={detailValue}>{spaces.join(', ')}</Column>
              </Row>
            )}

            {accommodationSummary && (
              <>
                <Hr style={hr} />
                <Heading as="h3" style={h3}>Accommodation</Heading>
                {accommodationSummary.singleBB > 0 && (
                  <Row style={detailRow}>
                    <Column style={detailLabel}>Single Rooms:</Column>
                    <Column style={detailValue}>{accommodationSummary.singleBB}</Column>
                  </Row>
                )}
                {accommodationSummary.doubleBB > 0 && (
                  <Row style={detailRow}>
                    <Column style={detailLabel}>Double/Queen Rooms:</Column>
                    <Column style={detailValue}>{accommodationSummary.doubleBB}</Column>
                  </Row>
                )}
                {accommodationSummary.doubleEnsuite > 0 && (
                  <Row style={detailRow}>
                    <Column style={detailLabel}>Ensuite Rooms:</Column>
                    <Column style={detailValue}>{accommodationSummary.doubleEnsuite}</Column>
                  </Row>
                )}
                {accommodationSummary.studySuite > 0 && (
                  <Row style={detailRow}>
                    <Column style={detailLabel}>Study Suites:</Column>
                    <Column style={detailValue}>{accommodationSummary.studySuite}</Column>
                  </Row>
                )}
              </>
            )}

            {cateringSummary && cateringSummary.totalMeals > 0 && (
              <>
                <Hr style={hr} />
                <Heading as="h3" style={h3}>Catering</Heading>
                <Row style={detailRow}>
                  <Column style={detailLabel}>Total Meals:</Column>
                  <Column style={detailValue}>{cateringSummary.totalMeals}</Column>
                </Row>
              </>
            )}
          </Section>

          {/* Next Steps */}
          <Section style={nextStepsBox}>
            <Heading as="h2" style={h2}>Next Steps</Heading>
            <Text style={text}>
              You can manage your booking details through your customer portal:
            </Text>
            <ul style={list}>
              <li style={listItem}>View and update room allocations</li>
              <li style={listItem}>Manage meal selections and dietary requirements</li>
              <li style={listItem}>Review your booking timeline</li>
            </ul>
          </Section>

          {/* CTA Button */}
          <Section style={buttonContainer}>
            <Button style={button} href={portalUrl}>
              View Your Booking
            </Button>
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Text style={footer}>
            If you have any questions, please contact us at Holy Cross Centre.
          </Text>
          <Text style={footer}>
            <Link href={portalUrl} style={link}>
              {portalUrl}
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default BookingApprovedEmail;

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
  backgroundColor: '#2C5530', // Olive green from HCC theme
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

const h3 = {
  color: '#2C5530',
  fontSize: '16px',
  fontWeight: '600',
  margin: '12px 0 8px',
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

const link = {
  color: '#2C5530',
  textDecoration: 'underline',
};
