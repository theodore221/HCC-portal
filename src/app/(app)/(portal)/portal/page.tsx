// @ts-nocheck
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { CalendarIcon, MapPinIcon, UsersIcon } from "lucide-react";

import { sbServer } from "@/lib/supabase-server";
import { getCurrentProfile } from "@/lib/auth/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function CustomerPortalPage() {
  const supabase = await sbServer();
  const { profile } = await getCurrentProfile(supabase);

  if (!profile || profile.role !== "customer") {
    redirect("/login");
  }

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("customer_user_id", profile.id)
    .order("arrival_date", { ascending: false });

  if (error) {
    console.error("Error fetching bookings:", error);
    return <div>Error loading bookings. Please try again later.</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your upcoming and past bookings.
          </p>
        </div>
        <Button asChild>
          <Link href="/portal/new-booking">
            Create New Booking
          </Link>
        </Button>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <CalendarIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No bookings found</h3>
            <p className="text-muted-foreground mt-2 max-w-sm">
              You don&apos;t have any bookings linked to your account yet. If
              you believe this is an error, please contact the administration.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {bookings.map((booking) => (
            <Link
              key={booking.id}
              href={`/portal/${booking.reference || booking.id}`}
            >
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-primary/50">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg font-semibold line-clamp-1">
                      {booking.event_type || "Event Booking"}
                    </CardTitle>
                    <StatusBadge status={booking.status} />
                  </div>
                  <CardDescription className="line-clamp-1">
                    Ref: {booking.reference || "N/A"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarIcon className="h-4 w-4 shrink-0" />
                    <span>
                      {format(new Date(booking.arrival_date), "MMM d, yyyy")}
                      {booking.nights > 0 && ` (${booking.nights} nights)`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <UsersIcon className="h-4 w-4 shrink-0" />
                    <span>{booking.headcount} Guests</span>
                  </div>
                  {booking.booking_type === "Group" && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <UsersIcon className="h-4 w-4 shrink-0" />
                      <span>Group Booking</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

const statusLabels: Partial<Record<string, string>> = {
  AwaitingDetails: "Awaiting Details",
  Pending: "Pending",
  Approved: "Approved",
  Confirmed: "Confirmed",
  InProgress: "In Progress",
  Completed: "Completed",
  Cancelled: "Cancelled",
};

function StatusBadge({ status }: { status: string }) {
  let variant: "default" | "secondary" | "destructive" | "outline" = "outline";

  switch (status) {
    case "Approved":
    case "Confirmed":
      variant = "default";
      break;
    case "AwaitingDetails":
    case "Pending":
    case "InProgress":
      variant = "secondary";
      break;
    case "Cancelled":
      variant = "destructive";
      break;
    case "Completed":
      variant = "outline";
      break;
  }

  return <Badge variant={variant}>{statusLabels[status] ?? status}</Badge>;
}
