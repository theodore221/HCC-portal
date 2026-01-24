import { getBookingsForAdminPaginated } from "@/lib/queries/bookings.server";
import type { BookingStatus } from "@/lib/queries/bookings";
import AdminBookingsClient from "./client";

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    status?: string;
    search?: string;
  }>;
}) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;
  const statusFilter = params.status
    ? (params.status.split(",") as BookingStatus[])
    : undefined;
  const searchQuery = params.search || undefined;

  const { bookings, totalCount, statusCounts } =
    await getBookingsForAdminPaginated({
      page,
      pageSize: 50,
      status: statusFilter,
      search: searchQuery,
    });

  return (
    <AdminBookingsClient
      bookings={bookings}
      totalCount={totalCount}
      currentPage={page}
      pageSize={50}
      statusCounts={statusCounts}
      initialStatusFilter={statusFilter}
      initialSearch={searchQuery}
    />
  );
}
