"use server";

import { sbServer } from "@/lib/supabase-server";
import { getCurrentProfile } from "@/lib/auth/server";
import { revalidatePath } from "next/cache";
import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";
import type { EnquiryStatus, NoteType } from "@/lib/queries/enquiries";

/**
 * Update enquiry status and log the change
 */
export async function updateEnquiryStatus(
  enquiryId: string,
  newStatus: EnquiryStatus,
  fromStatus?: EnquiryStatus
) {
  const sb: any = await sbServer();
  const { profile } = await getCurrentProfile();

  if (!profile) {
    throw new Error("Not authenticated");
  }

  // Update status
  const { error: updateError } = await sb
    .from("enquiries")
    .update({ status: newStatus })
    .eq("id", enquiryId);

  if (updateError) {
    console.error("Error updating enquiry status:", updateError);
    throw new Error("Failed to update enquiry status");
  }

  // Insert status change note
  const { error: noteError } = await sb
    .from("enquiry_notes")
    .insert({
      enquiry_id: enquiryId,
      author_id: profile.id,
      author_name: profile.full_name || profile.email,
      note_type: "status_change",
      content: `Status changed to ${newStatus}`,
      metadata: {
        from_status: fromStatus,
        to_status: newStatus,
      },
    });

  if (noteError) {
    console.error("Error creating status change note:", noteError);
  }

  revalidatePath(`/admin/enquiries/${enquiryId}`);
  revalidatePath("/admin/enquiries");
  revalidateTag(CACHE_TAGS.ENQUIRIES, {});
}

/**
 * Add a note to an enquiry
 */
export async function addEnquiryNote(
  enquiryId: string,
  content: string,
  noteType: NoteType = "note"
) {
  const sb: any = await sbServer();
  const { profile } = await getCurrentProfile();

  if (!profile) {
    throw new Error("Not authenticated");
  }

  const { error } = await sb
    .from("enquiry_notes")
    .insert({
      enquiry_id: enquiryId,
      author_id: profile.id,
      author_name: profile.full_name || profile.email,
      note_type: noteType,
      content,
    });

  if (error) {
    console.error("Error adding enquiry note:", error);
    throw new Error("Failed to add note");
  }

  revalidatePath(`/admin/enquiries/${enquiryId}`);
}

/**
 * Create a new quote for an enquiry
 */
export async function createEnquiryQuote(
  enquiryId: string,
  data: {
    amount: number;
    description?: string;
    notes?: string;
    reasonForChange?: string;
  }
) {
  const sb: any = await sbServer();
  const { profile } = await getCurrentProfile();

  if (!profile) {
    throw new Error("Not authenticated");
  }

  // Get current highest version number
  const { data: existingQuotes, error: fetchError } = await sb
    .from("enquiry_quotes")
    .select("version_number")
    .eq("enquiry_id", enquiryId)
    .order("version_number", { ascending: false })
    .limit(1);

  if (fetchError) {
    console.error("Error fetching existing quotes:", fetchError);
    throw new Error("Failed to fetch existing quotes");
  }

  const nextVersion = existingQuotes && existingQuotes.length > 0
    ? existingQuotes[0].version_number + 1
    : 1;

  // Insert quote
  const { error: insertError } = await sb
    .from("enquiry_quotes")
    .insert({
      enquiry_id: enquiryId,
      version_number: nextVersion,
      amount: data.amount,
      description: data.description || null,
      notes: data.notes || null,
      reason_for_change: data.reasonForChange || null,
      created_by: profile.id,
      created_by_name: profile.full_name || profile.email,
    });

  if (insertError) {
    console.error("Error creating quote:", insertError);
    throw new Error("Failed to create quote");
  }

  // Update enquiry quoted_amount
  const { error: updateError } = await sb
    .from("enquiries")
    .update({ quoted_amount: data.amount })
    .eq("id", enquiryId);

  if (updateError) {
    console.error("Error updating enquiry quoted_amount:", updateError);
  }

  // Get current enquiry status to check if we need to transition
  const { data: enquiry } = await sb
    .from("enquiries")
    .select("status")
    .eq("id", enquiryId)
    .single();

  // Auto-transition to 'quoted' if not already there
  if (enquiry && enquiry.status !== "quoted" && enquiry.status !== "converted_to_booking") {
    await updateEnquiryStatus(enquiryId, "quoted", enquiry.status as EnquiryStatus);
  }

  // Insert quote_created note
  const { error: noteError } = await sb
    .from("enquiry_notes")
    .insert({
      enquiry_id: enquiryId,
      author_id: profile.id,
      author_name: profile.full_name || profile.email,
      note_type: "quote_created",
      content: `Quote v${nextVersion} created: $${data.amount.toFixed(2)}`,
      metadata: {
        version: nextVersion,
        amount: data.amount,
      },
    });

  if (noteError) {
    console.error("Error creating quote note:", noteError);
  }

  revalidatePath(`/admin/enquiries/${enquiryId}`);
  revalidatePath("/admin/enquiries");
  revalidateTag(CACHE_TAGS.ENQUIRIES, {});
}

/**
 * Mark a quote as accepted
 */
export async function acceptEnquiryQuote(enquiryId: string, quoteId: string) {
  const sb: any = await sbServer();

  // Get the quote to know its amount
  const { data: quote, error: fetchError } = await sb
    .from("enquiry_quotes")
    .select("amount")
    .eq("id", quoteId)
    .single();

  if (fetchError || !quote) {
    console.error("Error fetching quote:", fetchError);
    throw new Error("Failed to fetch quote");
  }

  // Set all quotes for this enquiry to is_accepted = false
  const { error: resetError } = await sb
    .from("enquiry_quotes")
    .update({ is_accepted: false })
    .eq("enquiry_id", enquiryId);

  if (resetError) {
    console.error("Error resetting quote acceptance:", resetError);
    throw new Error("Failed to reset quote acceptance");
  }

  // Set the chosen quote to is_accepted = true
  const { error: acceptError } = await sb
    .from("enquiry_quotes")
    .update({ is_accepted: true })
    .eq("id", quoteId);

  if (acceptError) {
    console.error("Error accepting quote:", acceptError);
    throw new Error("Failed to accept quote");
  }

  // Update enquiry quoted_amount to the accepted quote's amount
  const { error: updateError } = await sb
    .from("enquiries")
    .update({ quoted_amount: quote.amount })
    .eq("id", enquiryId);

  if (updateError) {
    console.error("Error updating enquiry quoted_amount:", updateError);
  }

  revalidatePath(`/admin/enquiries/${enquiryId}`);
  revalidatePath("/admin/enquiries");
  revalidateTag(CACHE_TAGS.ENQUIRIES, {});
}

/**
 * Mark enquiry as lost with a reason
 */
export async function markEnquiryAsLost(enquiryId: string, reason: string) {
  const sb: any = await sbServer();
  const { profile } = await getCurrentProfile();

  if (!profile) {
    throw new Error("Not authenticated");
  }

  // Get current status
  const { data: enquiry } = await sb
    .from("enquiries")
    .select("status")
    .eq("id", enquiryId)
    .single();

  const fromStatus = enquiry?.status as EnquiryStatus;

  // Update status and lost_reason
  const { error: updateError } = await sb
    .from("enquiries")
    .update({
      status: "lost",
      lost_reason: reason,
    })
    .eq("id", enquiryId);

  if (updateError) {
    console.error("Error marking enquiry as lost:", updateError);
    throw new Error("Failed to mark enquiry as lost");
  }

  // Insert status change note with reason
  const { error: noteError } = await sb
    .from("enquiry_notes")
    .insert({
      enquiry_id: enquiryId,
      author_id: profile.id,
      author_name: profile.full_name || profile.email,
      note_type: "status_change",
      content: `Marked as lost: ${reason}`,
      metadata: {
        from_status: fromStatus,
        to_status: "lost",
        lost_reason: reason,
      },
    });

  if (noteError) {
    console.error("Error creating lost note:", noteError);
  }

  revalidatePath(`/admin/enquiries/${enquiryId}`);
  revalidatePath("/admin/enquiries");
  revalidateTag(CACHE_TAGS.ENQUIRIES, {});
}

/**
 * Convert enquiry to booking (delegates to existing create-link action)
 */
export async function convertEnquiryToBooking(
  enquiryId: string,
  data: {
    customer_name: string;
    customer_email: string;
    organization?: string;
    discount_percentage?: number;
    custom_pricing_notes?: string;
  }
) {
  // Import and call the existing createCustomBookingLink action
  const { createCustomBookingLink } = await import(
    "@/app/(app)/(admin)/admin/bookings/create-link/actions"
  );

  const result = await createCustomBookingLink({
    ...data,
    enquiry_id: enquiryId,
  });

  // The createCustomBookingLink already handles:
  // - Creating the booking
  // - Updating enquiry status to 'converted_to_booking'
  // - Setting converted_to_booking_id
  // - Revalidating paths

  return result;
}
