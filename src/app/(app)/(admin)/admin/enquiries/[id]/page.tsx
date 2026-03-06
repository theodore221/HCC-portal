/**
 * Enquiry Detail Page - Server Component
 * Parallelizes data fetching for optimal performance
 */

import { notFound } from "next/navigation";
import { EnquiryDetailClient } from "./client";
import {
  getEnquiryById,
  getEnquiryNotes,
  getEnquiryQuotes,
  getPricingReferenceData,
} from "@/lib/queries/enquiries.server";
import { getCurrentProfile } from "@/lib/auth/server";
import { sbServer } from "@/lib/supabase-server";
import type { BookingSearchResult } from "./actions";

export const dynamic = "force-dynamic";

interface EnquiryDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EnquiryDetailPage({ params }: EnquiryDetailPageProps) {
  // Await params first (Next.js 15+ requirement)
  const { id } = await params;

  try {
    // Parallelize all independent queries
    const [enquiry, notes, quotes, { profile }, pricingData] = await Promise.all([
      getEnquiryById(id),
      getEnquiryNotes(id),
      getEnquiryQuotes(id),
      getCurrentProfile(),
      getPricingReferenceData(),
    ]);

    if (!enquiry) {
      notFound();
    }

    const sb: any = await sbServer();
    const isLinkable = enquiry.status === "in_discussion" || enquiry.status === "quoted";

    // Fetch auto-matched bookings + linked booking in parallel (post-enquiry-load)
    const [autoMatchedResult, linkedBookingResult] = await Promise.all([
      // Auto-match by email exact or name ilike — only when linkable
      isLinkable
        ? sb
            .from("bookings")
            .select("id, reference, customer_name, customer_email, arrival_date, departure_date, status, headcount")
            .or(
              enquiry.customer_email
                ? `customer_email.eq.${enquiry.customer_email},customer_name.ilike.%${enquiry.customer_name}%`
                : `customer_name.ilike.%${enquiry.customer_name}%`
            )
            .order("arrival_date", { ascending: false })
            .limit(5)
        : Promise.resolve({ data: [] }),

      // Linked booking summary
      (enquiry as any).converted_to_booking_id
        ? sb
            .from("bookings")
            .select("id, reference, status, customer_name")
            .eq("id", (enquiry as any).converted_to_booking_id)
            .single()
        : Promise.resolve({ data: null }),
    ]);

    const autoMatchedBookings: BookingSearchResult[] = autoMatchedResult.data ?? [];
    const linkedBooking = linkedBookingResult.data as {
      id: string;
      reference: string | null;
      status: string;
      customer_name: string | null;
    } | null;

    return (
      <EnquiryDetailClient
        enquiry={enquiry}
        notes={notes}
        quotes={quotes}
        pricingData={pricingData}
        currentUserName={profile?.full_name || profile?.email || "Unknown"}
        autoMatchedBookings={autoMatchedBookings}
        linkedBooking={linkedBooking}
      />
    );
  } catch (error) {
    console.error("Error loading enquiry details:", {
      enquiryId: id,
      error,
      message: error instanceof Error ? error.message : String(error),
    });

    // Show error details in development
    if (process.env.NODE_ENV === 'development') {
      return (
        <div className="p-6">
          <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
            <h2 className="text-lg font-bold text-red-900">Error Loading Enquiry</h2>
            <p className="mt-2 text-sm text-red-700">
              {error instanceof Error ? error.message : String(error)}
            </p>
            <pre className="mt-4 overflow-auto rounded bg-red-100 p-3 text-xs text-red-800">
              {JSON.stringify(error, null, 2)}
            </pre>
          </div>
        </div>
      );
    }

    notFound();
  }
}
