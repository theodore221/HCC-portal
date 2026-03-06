import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Button,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface CateringStatusChangeEmailProps {
  recipientName: string;
  catererName: string;
  groupName: string;
  mealType: string;
  newStatus: string;
  reason?: string;
  portalUrl: string;
}

export const CateringStatusChangeEmail = ({
  recipientName,
  catererName,
  groupName,
  mealType,
  newStatus,
  reason,
  portalUrl,
}: CateringStatusChangeEmailProps) => (
  <Html>
    <Head />
    <Preview>
      {catererName} {newStatus === "Confirmed" ? "confirmed" : "updated"} the {mealType} job for {groupName}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>Job Status Update</Heading>
        </Section>

        <Text style={text}>Hi {recipientName},</Text>
        <Text style={text}>
          <strong>{catererName}</strong> has updated the status of the{" "}
          <strong>{mealType}</strong> job for <strong>{groupName}</strong> to{" "}
          <strong>{newStatus}</strong>.
        </Text>

        {reason && (
          <Section style={reasonBox}>
            <Text style={reasonText}>Reason: {reason}</Text>
          </Section>
        )}

        <Section style={buttonContainer}>
          <Button style={button} href={portalUrl}>
            View Job
          </Button>
        </Section>

        <Hr style={hr} />
        <Text style={footer}>
          Log in to the portal to take further action on this catering job.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default CateringStatusChangeEmail;

const main = { backgroundColor: "#f6f9fc", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" };
const container = { backgroundColor: "#ffffff", margin: "0 auto", padding: "20px 0 48px", marginBottom: "64px", maxWidth: "600px" };
const header = { padding: "32px 40px", backgroundColor: "#6c8f36", borderRadius: "8px 8px 0 0" };
const h1 = { color: "#ffffff", fontSize: "28px", fontWeight: "bold", margin: "0", lineHeight: "1.2" };
const text = { color: "#333", fontSize: "15px", lineHeight: "24px", margin: "16px 40px" };
const reasonBox = { padding: "16px 40px", backgroundColor: "#fff7ed", margin: "8px 40px", borderRadius: "8px", border: "1px solid #fed7aa" };
const reasonText = { color: "#9a3412", fontSize: "14px", margin: "0" };
const hr = { borderColor: "#e5e7eb", margin: "16px 0" };
const buttonContainer = { padding: "24px 40px", textAlign: "center" as const };
const button = { backgroundColor: "#6c8f36", borderRadius: "6px", color: "#ffffff", fontSize: "16px", fontWeight: "600", textDecoration: "none", textAlign: "center" as const, display: "inline-block", padding: "12px 32px" };
const footer = { color: "#6B7280", fontSize: "12px", lineHeight: "20px", margin: "8px 40px" };
