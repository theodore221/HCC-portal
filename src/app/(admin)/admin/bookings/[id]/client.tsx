"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusChip } from "@/components/ui/status-chip";
import { ConflictBanner } from "@/components/ui/conflict-banner";
import { MealSlotCard } from "@/components/ui/meal-slot-card";
import { AuditTimeline } from "@/components/ui/audit-timeline";
import { RoomCard } from "@/components/ui/room-card";
import { Button } from "@/components/ui/button";
import { formatDateRange } from "@/lib/utils";
import type { EnrichedMealJob } from "@/lib/catering";
import type { BookingWithMeta, RoomWithAssignments } from "@/lib/queries/bookings";

const tabConfig = [
  { value: "overview", label: "Overview" },
  { value: "triage", label: "Triage" },
  { value: "spaces", label: "Spaces" },
  { value: "accommodation", label: "Accommodation" },
  { value: "catering", label: "Catering" },
  { value: "timeline", label: "Timeline" },
  { value: "docs", label: "Docs" },
];

export default function BookingDetailClient({
  booking,
  displayName,
  mealJobs,
  rooms,
}: {
  booking: BookingWithMeta;
  displayName: string;
  mealJobs: EnrichedMealJob[];
  rooms: RoomWithAssignments[];
}) {
  const router = useRouter();
  const [isApproving, setIsApproving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const bookingReferenceLabel =
    typeof booking.reference === "string" && booking.reference.trim().length > 0
      ? booking.reference.trim()
      : booking.id;
  const arrivalDateLabel = formatDisplayDate(booking.arrival_date);
  const departureDateLabel = formatDisplayDate(booking.departure_date);
  const customerNameValue = booking.customer_name?.trim() || "—";
  const contactNameValue = booking.contact_name?.trim() || "—";
  const customerEmailValue = booking.customer_email
    ? (
        <a
          href={`mailto:${booking.customer_email}`}
          className="text-olive-900 underline-offset-2 hover:underline"
        >
          {booking.customer_email}
        </a>
      )
    : "—";
  const contactPhoneValue = booking.contact_phone
    ? (
        <a
          href={`tel:${booking.contact_phone}`}
          className="text-olive-900 underline-offset-2 hover:underline"
        >
          {booking.contact_phone}
        </a>
      )
    : "—";
  const spacesSummary = booking.spaces.length ? booking.spaces.join(", ") : "None assigned";
  const conflictSummary = booking.conflicts.length ? booking.conflicts.join(", ") : "None";

  useEffect(() => {
    if (!toastMessage) {
      return undefined;
    }

    const timer = setTimeout(() => setToastMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const handleApproveBooking = useCallback(async () => {
    setIsApproving(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/bookings/${booking.id}/approve`, { method: "POST" });

      let payload: unknown;
      try {
        payload = await response.json();
      } catch (parseError) {
        console.error("Failed to parse approval response", parseError);
      }

      const successPayload =
        typeof payload === "object" && payload !== null ? (payload as { success?: boolean; error?: string; data?: unknown }) : null;

      if (!response.ok || !successPayload?.success) {
        const message =
          successPayload?.error ??
          (response.ok ? "We couldn't approve this booking. Please try again." : response.statusText || "Approval failed.");
        throw new Error(message);
      }

      const data =
        successPayload?.data && typeof successPayload.data === "object"
          ? (successPayload.data as { reference?: string | null; email?: string | null })
          : null;

      const referenceLabel =
        (typeof data?.reference === "string" && data.reference.trim()) ?? bookingReferenceLabel;
      const recipient = data?.email ?? booking.customer_email ?? null;

      setToastMessage(
        recipient
          ? `Approval email sent to ${recipient} for booking ${referenceLabel}.`
          : `Booking ${referenceLabel} approved and invitation sent.`,
      );

      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "We couldn't approve this booking. Please try again.";
      setErrorMessage(message);
    } finally {
      setIsApproving(false);
    }
  }, [booking.customer_email, bookingReferenceLabel, booking.id, router]);

  return (
    <>
      <Tabs defaultValue="overview" className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>{displayName}</CardTitle>
            <CardDescription>
              {formatDateRange(booking.arrival_date, booking.departure_date)} · {booking.headcount} guests
            </CardDescription>
          </div>
          <StatusChip status={booking.status} />
        </CardHeader>
        <CardContent>
          <TabsList className="flex flex-wrap gap-2 bg-transparent p-0">
            {tabConfig.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-full border border-transparent"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </CardContent>
      </Card>

      <TabsContent value="overview" className="space-y-6 p-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-olive-600">
            Status timeline
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {["Pending", "Approved", "Deposit Received"].map((stage) => (
              <div
                key={stage}
                className="rounded-xl border border-olive-100 bg-white/80 p-4 text-sm"
              >
                <p className="font-semibold text-olive-900">{stage}</p>
                <p className="text-xs text-olive-700">Date placeholder</p>
              </div>
            ))}
          </div>
        </section>
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-olive-600">
            Summary
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <InfoBlock label="Reference" value={bookingReferenceLabel} />
            <InfoBlock label="Booking type" value={booking.booking_type} />
            <InfoBlock label="Guests" value={`${booking.headcount}`} />
            <InfoBlock
              label="Overnight"
              value={booking.is_overnight ? "Yes" : "No"}
            />
            <InfoBlock
              label="Catering"
              value={booking.catering_required ? "Required" : "Not required"}
            />
            <InfoBlock label="Arrival" value={arrivalDateLabel} />
            <InfoBlock label="Departure" value={departureDateLabel} />
            <InfoBlock label="Spaces" value={spacesSummary} />
            <InfoBlock label="Conflicts" value={conflictSummary} />
          </div>
        </section>
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-olive-600">
            Customer details
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <InfoBlock label="Customer" value={customerNameValue} />
            <InfoBlock label="Email" value={customerEmailValue} />
            <InfoBlock label="Primary contact" value={contactNameValue} />
            <InfoBlock label="Contact phone" value={contactPhoneValue} />
          </div>
        </section>
      </TabsContent>

      <TabsContent value="triage" className="space-y-6 p-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-olive-600">
            Conflict review
          </h3>
          <ConflictBanner issues={booking.conflicts} />
        </section>
        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-olive-100 bg-white p-4">
            <p className="text-sm font-semibold text-olive-900">
              Requested spaces
            </p>
            <ul className="mt-3 space-y-2 text-sm text-olive-800">
              {booking.spaces.length ? (
                booking.spaces.map((space) => (
                  <li key={space} className="flex items-center justify-between">
                    <span>{space}</span>
                    <span className="text-xs text-olive-600">Hold confirmed</span>
                  </li>
                ))
              ) : (
                <li className="text-xs text-olive-600">No spaces assigned yet.</li>
              )}
            </ul>
          </div>
          <div className="rounded-xl border border-olive-100 bg-white p-4">
            <p className="text-sm font-semibold text-olive-900">
              Capacity &amp; warnings
            </p>
            <ul className="mt-3 space-y-2 text-sm text-olive-800">
              <li>
                Headcount {booking.headcount} vs beds 80 ·{" "}
                <span className="font-semibold text-emerald-700">OK</span>
              </li>
              {booking.conflicts.map((conflict) => (
                <li key={conflict}>{conflict}</li>
              ))}
              {!booking.conflicts.length && <li>No conflicts detected.</li>}
            </ul>
          </div>
        </section>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline">Mark as In Triage</Button>
            <Button
              type="button"
              onClick={handleApproveBooking}
              disabled={isApproving}
              aria-busy={isApproving}
              className="gap-2"
            >
              {isApproving ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Approving…
                </>
              ) : (
                "Approve booking"
              )}
            </Button>
            <Button variant="ghost">Record deposit</Button>
          </div>
          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
        </div>
      </TabsContent>

      <TabsContent value="spaces" className="space-y-6 p-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-olive-600">
            Spaces timeline
          </h3>
          <div className="rounded-xl border border-olive-100 bg-white p-4 text-sm text-olive-800">
            Timeline visual placeholder showing holds per day.
          </div>
        </section>
      </TabsContent>

      <TabsContent value="accommodation" className="space-y-6 p-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-olive-600">
            Room inventory
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            {rooms.length ? (
              rooms.map((room) => <RoomCard key={room.id} room={room} />)
            ) : (
              <p className="text-sm text-olive-700">No room assignments yet.</p>
            )}
          </div>
        </section>
      </TabsContent>

      <TabsContent value="catering" className="space-y-6 p-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-olive-600">
            Meal plan
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {mealJobs.length ? (
              mealJobs.map((job) => <MealSlotCard key={job.id} job={job} />)
            ) : (
              <p className="text-sm text-olive-700">No catering services scheduled.</p>
            )}
          </div>
        </section>
      </TabsContent>

      <TabsContent value="timeline" className="space-y-6 p-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-olive-600">
            Audit timeline
          </h3>
          <AuditTimeline
            events={[
              {
                id: "1",
                actor: "Amelia (Admin)",
                timestamp: new Date().toISOString(),
                description: "Updated headcount from 45 to 48",
              },
              {
                id: "2",
                actor: "Finance",
                timestamp: new Date().toISOString(),
                description: "Marked deposit received",
              },
            ]}
          />
        </section>
      </TabsContent>

      <TabsContent value="docs" className="space-y-6 p-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-olive-600">
            Documents
          </h3>
          <div className="rounded-xl border border-dashed border-olive-200 bg-white p-4 text-sm text-olive-700">
            Upload agreements, run sheets or insurance certificates for this booking.
          </div>
        </section>
      </TabsContent>
      </Tabs>
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-olive-900 px-4 py-3 text-sm text-white shadow-lg">
          {toastMessage}
        </div>
      )}
    </>
  );
}

function InfoBlock({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-olive-600">{label}</p>
      <div className="text-sm font-medium text-olive-900 text-pretty break-words">
        {value ?? "—"}
      </div>
    </div>
  );
}

const displayDateFormatter = new Intl.DateTimeFormat("en-AU", { dateStyle: "medium" });

function formatDisplayDate(value: string) {
  return displayDateFormatter.format(new Date(value));
}
