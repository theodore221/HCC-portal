/**
 * Customer Portal: Create New Booking
 * Allows existing customers to create new bookings, with option to copy from previous bookings
 */

import { redirect } from "next/navigation";
import { sbServer } from "@/lib/supabase-server";
import { getCurrentProfile } from "@/lib/auth/server";
import { getOrCreateCSRFToken } from "@/lib/security/csrf-actions";
import { NewBookingForm } from "./new-booking-form";

export const dynamic = "force-dynamic";

export default async function PortalNewBookingPage() {
  const supabase = await sbServer();
  const { profile } = await getCurrentProfile(supabase);

  if (!profile || profile.role !== "customer") {
    redirect("/login?redirect=/portal/new-booking");
  }

  // Fetch customer's previous bookings for reference
  const { data: previousBookings, error } = await supabase
    .from("bookings")
    .select("id, reference, event_type, booking_type, arrival_date, departure_date, headcount, whole_centre, is_overnight, catering_required, notes, status")
    .eq("customer_user_id", profile.id)
    .in("status", ["Approved", "Confirmed", "Completed"])
    .order("arrival_date", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error fetching previous bookings:", error);
  }

  const csrfToken = await getOrCreateCSRFToken();

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create New Booking</h1>
        <p className="text-muted-foreground mt-2">
          Submit a new booking request. Your booking will be reviewed by our team before confirmation.
        </p>
      </div>

      <NewBookingForm
        csrfToken={csrfToken}
        customerEmail={profile.email || ""}
        customerName={profile.full_name || ""}
        previousBookings={previousBookings || []}
      />
    </div>
  );
}
