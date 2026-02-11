import { sbServer } from "@/lib/supabase-server";
import type { Enquiry, EnquiryNote, EnquiryQuote, EnquiryStatus } from "./enquiries";

/**
 * Get enquiries for admin with optional filtering
 */
export async function getEnquiriesForAdmin(params?: {
  status?: EnquiryStatus;
  search?: string;
}) {
  const sb: any = await sbServer();

  // Build base query
  let query = sb
    .from("enquiries")
    .select("*")
    .order("created_at", { ascending: false });

  // Apply status filter
  if (params?.status) {
    query = query.eq("status", params.status);
  }

  // Apply search filter (name, email, reference, org)
  if (params?.search && params.search.trim()) {
    const searchTerm = `%${params.search.trim()}%`;
    query = query.or(
      `customer_name.ilike.${searchTerm},customer_email.ilike.${searchTerm},reference_number.ilike.${searchTerm},organization.ilike.${searchTerm}`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching enquiries:", error);
    throw new Error("Failed to fetch enquiries");
  }

  return data as Enquiry[];
}

/**
 * Get status counts for metrics
 */
export async function getEnquiryStatusCounts() {
  const sb: any = await sbServer();

  const { data, error } = await sb
    .from("enquiries")
    .select("status");

  if (error) {
    console.error("Error fetching status counts:", error);
    throw new Error("Failed to fetch status counts");
  }

  // Count by status
  const counts: Record<EnquiryStatus, number> = {
    new: 0,
    in_discussion: 0,
    quoted: 0,
    ready_to_book: 0,
    converted_to_booking: 0,
    lost: 0,
  };

  data.forEach((row: any) => {
    const status = row.status as EnquiryStatus;
    counts[status] = (counts[status] || 0) + 1;
  });

  return {
    total: data.length,
    ...counts,
    conversionRate: data.length > 0
      ? Math.round((counts.converted_to_booking / data.length) * 100)
      : 0,
  };
}

/**
 * Get single enquiry by ID
 */
export async function getEnquiryById(id: string) {
  const sb: any = await sbServer();

  const { data, error } = await sb
    .from("enquiries")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching enquiry:", error);
    throw new Error("Failed to fetch enquiry");
  }

  return data as Enquiry;
}

/**
 * Get all notes for an enquiry
 */
export async function getEnquiryNotes(enquiryId: string) {
  const sb: any = await sbServer();

  const { data, error } = await sb
    .from("enquiry_notes")
    .select("*")
    .eq("enquiry_id", enquiryId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching enquiry notes:", {
      error,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
      code: error?.code,
    });
    throw new Error(`Failed to fetch enquiry notes: ${error?.message || JSON.stringify(error)}`);
  }

  return data as EnquiryNote[];
}

/**
 * Get all quotes for an enquiry
 */
export async function getEnquiryQuotes(enquiryId: string) {
  const sb: any = await sbServer();

  const { data, error } = await sb
    .from("enquiry_quotes")
    .select("*")
    .eq("enquiry_id", enquiryId)
    .order("version_number", { ascending: true });

  if (error) {
    console.error("Error fetching enquiry quotes:", {
      error,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
      code: error?.code,
    });
    throw new Error(`Failed to fetch enquiry quotes: ${error?.message || JSON.stringify(error)}`);
  }

  return data as EnquiryQuote[];
}
