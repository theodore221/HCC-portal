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
} from "@react-email/components";
import * as React from "react";

interface CateringJobAssignedEmailProps {
  catererName: string;
  groupName: string;
  mealType: string;
  serviceDate: string;
  headcount: number;
  portalUrl: string;
}

export const CateringJobAssignedEmail = ({
  catererName,
  groupName,
  mealType,
  serviceDate,
  headcount,
  portalUrl,
}: CateringJobAssignedEmailProps) => (
  <Html>
    <Head />
    <Preview>New catering job assigned: {mealType} for {groupName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>New Catering Job</Heading>
        </Section>

        <Text style={text}>Dear {catererName},</Text>
        <Text style={text}>
          You have been assigned a new catering job at the Holy Cross Centre.
        </Text>

        <Section style={detailsBox}>
          <Heading as="h2" style={h2}>Job Details</Heading>
          <Hr style={hr} />
          <Text style={detail}><strong>Group:</strong> {groupName}</Text>
          <Text style={detail}><strong>Meal:</strong> {mealType}</Text>
          <Text style={detail}><strong>Date:</strong> {serviceDate}</Text>
          <Text style={detail}><strong>Headcount:</strong> {headcount} guests</Text>
        </Section>

        <Section style={buttonContainer}>
          <Button style={button} href={portalUrl}>
            View Job in Portal
          </Button>
        </Section>

        <Hr style={hr} />
        <Text style={footer}>
          Please log in to the portal to accept or request changes for this job.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default CateringJobAssignedEmail;

const main = { backgroundColor: "#f6f9fc", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" };
const container = { backgroundColor: "#ffffff", margin: "0 auto", padding: "20px 0 48px", marginBottom: "64px", maxWidth: "600px" };
const header = { padding: "32px 40px", backgroundColor: "#6c8f36", borderRadius: "8px 8px 0 0" };
const h1 = { color: "#ffffff", fontSize: "28px", fontWeight: "bold", margin: "0", lineHeight: "1.2" };
const h2 = { color: "#6c8f36", fontSize: "18px", fontWeight: "600", margin: "0 0 12px" };
const text = { color: "#333", fontSize: "15px", lineHeight: "24px", margin: "16px 40px" };
const detail = { color: "#333", fontSize: "14px", lineHeight: "22px", margin: "4px 0" };
const detailsBox = { padding: "24px 40px", backgroundColor: "#f9fafb", margin: "24px 40px", borderRadius: "8px", border: "1px solid #e5e7eb" };
const hr = { borderColor: "#e5e7eb", margin: "16px 0" };
const buttonContainer = { padding: "24px 40px", textAlign: "center" as const };
const button = { backgroundColor: "#6c8f36", borderRadius: "6px", color: "#ffffff", fontSize: "16px", fontWeight: "600", textDecoration: "none", textAlign: "center" as const, display: "inline-block", padding: "12px 32px" };
const footer = { color: "#6B7280", fontSize: "12px", lineHeight: "20px", margin: "8px 40px" };
