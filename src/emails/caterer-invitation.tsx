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
} from '@react-email/components';
import * as React from 'react';

interface CatererInvitationEmailProps {
  catererName: string;
  loginUrl: string;
}

export const CatererInvitationEmail = ({
  catererName,
  loginUrl,
}: CatererInvitationEmailProps) => {
  const previewText = `Welcome to Holy Cross Centre Portal - Caterer Access`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>Welcome to HCC Portal</Heading>
          </Section>

          {/* Main Content */}
          <Text style={text}>Dear {catererName},</Text>
          <Text style={text}>
            You have been added to the Holy Cross Centre portal as a caterer. You now have access to manage catering orders and view booking details.
          </Text>

          {/* Access Information */}
          <Section style={detailsBox}>
            <Heading as="h2" style={h2}>Getting Started</Heading>
            <Hr style={hr} />
            <Text style={infoText}>
              Click the button below to access your caterer portal. You will be able to:
            </Text>
            <ul style={list}>
              <li style={listItem}>View assigned catering bookings</li>
              <li style={listItem}>Access meal selections and dietary requirements</li>
              <li style={listItem}>Update catering details and notes</li>
              <li style={listItem}>Manage your caterer profile</li>
            </ul>
          </Section>

          {/* CTA Button */}
          <Section style={buttonContainer}>
            <Button style={button} href={loginUrl}>
              Access Portal
            </Button>
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Text style={footer}>
            If you have any questions or need assistance, please contact the Holy Cross Centre administration.
          </Text>
          <Text style={footer}>
            This link will sign you in automatically. For security, please bookmark the portal and use magic link login for future access.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default CatererInvitationEmail;

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

const text = {
  color: '#333',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '16px 40px',
};

const infoText = {
  color: '#333',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 12px',
};

const detailsBox = {
  padding: '24px 40px',
  backgroundColor: '#f9fafb',
  margin: '24px 40px',
  borderRadius: '8px',
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
