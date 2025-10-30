import { AdminBookingsClient } from "./_components/bookings-table-client";
import { getBookingsForAdmin } from "@/lib/queries/bookings";
import { toBookingSummaries } from "@/lib/mappers";

export default async function AdminBookingsPage() {
  const bookings = await getBookingsForAdmin();
  const summaries = toBookingSummaries(bookings);
  return <AdminBookingsClient bookings={summaries} />;
}
