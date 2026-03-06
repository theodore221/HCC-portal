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

interface CateringCommentNotificationEmailProps {
  recipientName: string;
  authorName: string;
  authorRole: "admin" | "caterer";
  groupName: string;
  mealType: string;
  commentContent: string;
  portalUrl: string;
}

export const CateringCommentNotificationEmail = ({
  recipientName,
  authorName,
  authorRole,
  groupName,
  mealType,
  commentContent,
  portalUrl,
}: CateringCommentNotificationEmailProps) => (
  <Html>
    <Head />
    <Preview>New comment from {authorName} on {mealType} for {groupName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>New Comment</Heading>
        </Section>

        <Text style={text}>Hi {recipientName},</Text>
        <Text style={text}>
          {authorName} ({authorRole === "admin" ? "HCC Admin" : "Caterer"}) has posted a comment
          on the <strong>{mealType}</strong> job for <strong>{groupName}</strong>.
        </Text>

        <Section style={commentBox}>
          <Text style={commentText}>&ldquo;{commentContent}&rdquo;</Text>
        </Section>

        <Section style={buttonContainer}>
          <Button style={button} href={portalUrl}>
            View Conversation
          </Button>
        </Section>

        <Hr style={hr} />
        <Text style={footer}>
          Log in to the portal to reply to this message.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default CateringCommentNotificationEmail;

const main = { backgroundColor: "#f6f9fc", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" };
const container = { backgroundColor: "#ffffff", margin: "0 auto", padding: "20px 0 48px", marginBottom: "64px", maxWidth: "600px" };
const header = { padding: "32px 40px", backgroundColor: "#6c8f36", borderRadius: "8px 8px 0 0" };
const h1 = { color: "#ffffff", fontSize: "28px", fontWeight: "bold", margin: "0", lineHeight: "1.2" };
const text = { color: "#333", fontSize: "15px", lineHeight: "24px", margin: "16px 40px" };
const commentBox = { padding: "20px 40px", backgroundColor: "#f9fafb", margin: "8px 40px", borderRadius: "8px", border: "1px solid #e5e7eb", borderLeft: "4px solid #6c8f36" };
const commentText = { color: "#374151", fontSize: "15px", lineHeight: "24px", margin: "0", fontStyle: "italic" };
const hr = { borderColor: "#e5e7eb", margin: "16px 0" };
const buttonContainer = { padding: "24px 40px", textAlign: "center" as const };
const button = { backgroundColor: "#6c8f36", borderRadius: "6px", color: "#ffffff", fontSize: "16px", fontWeight: "600", textDecoration: "none", textAlign: "center" as const, display: "inline-block", padding: "12px 32px" };
const footer = { color: "#6B7280", fontSize: "12px", lineHeight: "20px", margin: "8px 40px" };
