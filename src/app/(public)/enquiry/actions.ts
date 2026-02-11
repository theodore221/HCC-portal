/**
 * Enquiry Form Server Actions
 *
 * Handles enquiry form submissions with security validation
 */

"use server";

import { sbAdmin } from "@/lib/supabase-admin";
import { enquirySchema, sanitizeEnquiryData } from "@/lib/validation/enquiry";
import {
  validateHoneypotFromJSON,
  validateSubmissionTime,
  HONEYPOT_FIELDS,
} from "@/lib/security";

export interface EnquirySubmissionResult {
  success: boolean;
  reference_number?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

/**
 * Submit enquiry form
 *
 * @param formData - Form data from client
 * @returns Submission result
 */
export async function submitEnquiry(
  formData: FormData,
): Promise<EnquirySubmissionResult> {
  try {
    // Convert FormData to object
    const rawData: any = Object.fromEntries(formData);

    // Parse estimated_guests as number
    if (rawData.estimated_guests) {
      rawData.estimated_guests = parseInt(
        rawData.estimated_guests as string,
        10,
      );
    }

    // 1. Validate honeypot (bot detection)
    const honeypotField = HONEYPOT_FIELDS.enquiry;
    const honeypotResult = validateHoneypotFromJSON(rawData, honeypotField);

    if (!honeypotResult.valid) {
      console.warn("Honeypot triggered on enquiry submission");
      return {
        success: false,
        error: "Invalid submission. Please try again.",
      };
    }

    // 2. Validate submission time (too fast = bot)
    const timeResult = validateSubmissionTime(rawData._form_time as string);

    if (!timeResult.valid) {
      console.warn("Submission time validation failed:", timeResult.message);
      return {
        success: false,
        error: "Please take a moment to fill out the form completely.",
      };
    }

    // 3. Validate form data with Zod
    const validationResult = enquirySchema.safeParse(rawData);

    if (!validationResult.success) {
      const errors: Record<string, string[]> = {};

      validationResult.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(issue.message);
      });

      return {
        success: false,
        error: "Please correct the errors in the form.",
        errors,
      };
    }

    // 4. Sanitize data (remove security fields)
    const cleanData = sanitizeEnquiryData(validationResult.data);

    // 5. Insert into database
    const supabase = sbAdmin();

    const { data: enquiry, error: dbError } = await supabase
      .from("enquiries")
      // @ts-ignore - Type compatibility issue
      .insert({
        ...cleanData,
        status: "new",
        submitted_from_ip: null, // Will be populated by trigger/RLS if needed
        submission_duration_seconds: timeResult.elapsed
          ? Math.floor(timeResult.elapsed)
          : null,
      })
      .select("*")
      .single() as any;

    if (dbError || !enquiry) {
      console.error("Database error creating enquiry:", dbError);
      return {
        success: false,
        error:
          "An error occurred while submitting your enquiry. Please try again.",
      };
    }

    // 6. Send confirmation email to customer (don't fail submission if email fails)
    try {
      const { sendEnquiryReceivedEmail } =
        await import("@/lib/email/send-enquiry-received");
      await sendEnquiryReceivedEmail(enquiry);
      console.log(
        `Enquiry confirmation email sent for ${enquiry.reference_number}`,
      );
    } catch (emailError) {
      console.error("Failed to send enquiry confirmation email:", emailError);
      // Continue - email failure shouldn't block enquiry submission
    }

    return {
      success: true,
      reference_number: enquiry.reference_number,
    };
  } catch (error) {
    console.error("Unexpected error in submitEnquiry:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}
