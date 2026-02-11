/**
 * Admin Enquiries Dashboard - Server Component
 * Fetches enquiries and passes to client component for rendering
 */

import { EnquiriesClient } from "./client";
import { getEnquiriesForAdmin, getEnquiryStatusCounts } from "@/lib/queries/enquiries.server";
import type { EnquiryStatus } from "@/lib/queries/enquiries";

export const dynamic = "force-dynamic";

interface EnquiriesPageProps {
  searchParams: Promise<{
    status?: EnquiryStatus;
    search?: string;
  }>;
}

export default async function EnquiriesPage({ searchParams }: EnquiriesPageProps) {
  // Await searchParams first (Next.js 15+ requirement)
  const params = await searchParams;

  // Parallelize independent queries
  const [enquiries, statusCounts] = await Promise.all([
    getEnquiriesForAdmin({
      status: params.status,
      search: params.search,
    }),
    getEnquiryStatusCounts(),
  ]);

  return (
    <EnquiriesClient
      enquiries={enquiries}
      statusCounts={statusCounts}
      initialFilters={{
        status: params.status,
        search: params.search,
      }}
    />
  );
}
