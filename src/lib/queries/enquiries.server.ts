import { sbServer } from "@/lib/supabase-server";
import { MEAL_ORDER } from "@/lib/catering";
import type { Enquiry, EnquiryNote, EnquiryQuote, EnquiryStatus } from "./enquiries";

// Same 4 room types shown in the customer booking form
const BOOKING_FORM_ROOM_TYPES = [
  "Single Bed",
  "Double Bed",
  "Double Bed + Ensuite",
  "Double Bed + Ensuite + Priv Study",
];

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
 * Get status counts for metrics using parallel COUNT queries (no full-table fetch)
 */
export async function getEnquiryStatusCounts() {
  const sb: any = await sbServer();

  const [
    { count: newCount },
    { count: inDiscussionCount },
    { count: quotedCount },
    { count: convertedCount },
    { count: lostCount },
    { count: total },
  ] = await Promise.all([
    sb.from("enquiries").select("*", { count: "exact", head: true }).eq("status", "new"),
    sb.from("enquiries").select("*", { count: "exact", head: true }).eq("status", "in_discussion"),
    sb.from("enquiries").select("*", { count: "exact", head: true }).eq("status", "quoted"),
    sb.from("enquiries").select("*", { count: "exact", head: true }).eq("status", "converted_to_booking"),
    sb.from("enquiries").select("*", { count: "exact", head: true }).eq("status", "lost"),
    sb.from("enquiries").select("*", { count: "exact", head: true }),
  ]);

  const n = newCount ?? 0;
  const id = inDiscussionCount ?? 0;
  const q = quotedCount ?? 0;
  const c = convertedCount ?? 0;
  const l = lostCount ?? 0;
  const t = total ?? 0;

  return {
    total: t,
    new: n,
    in_discussion: id,
    quoted: q,
    converted_to_booking: c,
    lost: l,
    conversionRate: t > 0 ? Math.round((c / t) * 100) : 0,
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
 * Fetch pricing reference data for the quote builder
 * Returns room types, active spaces, and meal prices
 */
export async function getPricingReferenceData() {
  const sb: any = await sbServer();

  const [{ data: roomTypes }, { data: spaces }, { data: mealPrices }] = await Promise.all([
    sb
      .from("room_types")
      .select("id, name, price")
      .in("name", BOOKING_FORM_ROOM_TYPES)
      .order("price"),
    sb.from("spaces").select("id, name, price").eq("active", true).order("name"),
    sb.from("meal_prices").select("meal_type, price"),
  ]);

  // Sort meals by the canonical MEAL_ORDER (same order as admin resources page)
  const sortedMealPrices = ((mealPrices || []) as { meal_type: string; price: number }[]).sort(
    (a, b) => {
      const ai = MEAL_ORDER.indexOf(a.meal_type);
      const bi = MEAL_ORDER.indexOf(b.meal_type);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    }
  );

  return {
    roomTypes: (roomTypes || []) as { id: string; name: string; price: number }[],
    spaces: (spaces || []) as { id: string; name: string; price: number }[],
    mealPrices: sortedMealPrices,
  };
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
