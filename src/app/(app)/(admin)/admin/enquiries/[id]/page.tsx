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
} from "@/lib/queries/enquiries.server";
import { getCurrentProfile } from "@/lib/auth/server";

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
    const [enquiry, notes, quotes, { profile }] = await Promise.all([
      getEnquiryById(id),
      getEnquiryNotes(id),
      getEnquiryQuotes(id),
      getCurrentProfile(),
    ]);

    if (!enquiry) {
      notFound();
    }

    return (
      <EnquiryDetailClient
        enquiry={enquiry}
        notes={notes}
        quotes={quotes}
        currentUserName={profile?.full_name || profile?.email || "Unknown"}
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
