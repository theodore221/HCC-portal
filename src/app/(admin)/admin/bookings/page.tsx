import { getBookingsForAdmin } from "@/lib/queries/bookings";
import AdminBookingsClient from "./client";

export default async function AdminBookingsPage() {
  const bookings = await getBookingsForAdmin();
  return <AdminBookingsClient bookings={bookings} />;
}
