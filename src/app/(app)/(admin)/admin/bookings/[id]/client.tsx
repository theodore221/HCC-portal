"use client";

import { useTransition, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusChip } from "@/components/ui/status-chip";

import { AuditTimeline } from "@/components/ui/audit-timeline";
import { RoomCard } from "@/components/ui/room-card";
import { Button } from "@/components/ui/button";
import { formatDateRange, cn } from "@/lib/utils";
import type { EnrichedMealJob } from "@/lib/catering";
import { SpacesTab } from "./spaces-tab";
import { CateringTab } from "./catering-tab";
import { updateBookingStatus, recordDeposit } from "./actions";
import type {
  BookingWithMeta,
  RoomWithAssignments,
  Space,
  SpaceReservation,
} from "@/lib/queries/bookings";
import type { Views } from "@/lib/database.types";

const tabConfig = [
  { value: "overview", label: "Overview" },
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
  allSpaces,
  reservations,
  conflicts,
  conflictingBookings,
  cateringOptions,
}: {
  booking: BookingWithMeta;
  displayName: string;
  mealJobs: EnrichedMealJob[];
  rooms: RoomWithAssignments[];
  allSpaces: Space[];
  reservations: SpaceReservation[];
  conflicts: Views<"v_space_conflicts">[];
  conflictingBookings: {
    id: string;
    reference: string | null;
    status: string;
    contact_name: string | null;
    customer_name: string | null;
  }[];
  cateringOptions: {
    caterers: { id: string; name: string }[];
    menuItems: { id: string; label: string; catererId: string | null; mealType: string | null }[];
  };
}) {
  const [isPending, startTransition] = useTransition();

  const handleApprove = () => {
    startTransition(async () => {
      await updateBookingStatus(booking.id, "Approved");
    });
  };

  const handleRecordDeposit = () => {
    startTransition(async () => {
      await recordDeposit(booking.id);
    });
  };

  const totalIssues = booking.conflicts.length;

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <Card className="shadow-soft">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold text-text">
              {displayName}
            </CardTitle>
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-bold text-text">
                {formatDateRange(booking.arrival_date, booking.departure_date)}
              </span>
              <span className="text-sm text-text-light">
                {booking.headcount} guests
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {conflicts.length > 0 && (
              <Badge variant="destructive" className="gap-1.5 px-3 py-1">
                <AlertTriangle className="size-3.5" />
                Conflicts
              </Badge>
            )}
            <StatusChip status={booking.status} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <TabsList className="flex flex-wrap items-center gap-2 rounded-full bg-neutral p-1">
              {tabConfig.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-text-light transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-text data-[state=active]:shadow-sm"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleRecordDeposit}
                disabled={
                  isPending ||
                  booking.deposit_status === "Paid" ||
                  booking.status !== "Approved"
                }
                className="border-olive-200 hover:bg-olive-50"
              >
                {booking.deposit_status === "Paid" ? (
                  <span className="flex items-center gap-2 text-olive-700">
                    <CheckCircle2 className="h-4 w-4" /> Deposit Paid
                  </span>
                ) : (
                  "Record Deposit"
                )}
              </Button>
              <Button
                onClick={handleApprove}
                disabled={
                  isPending ||
                  booking.status === "Approved" ||
                  booking.status === "Confirmed" ||
                  totalIssues > 0
                }
                className={cn(
                  totalIssues > 0
                    ? "opacity-50 cursor-not-allowed"
                    : "bg-primary hover:bg-primary/90"
                )}
              >
                {booking.status === "Approved" ||
                booking.status === "Confirmed" ? (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Approved
                  </span>
                ) : (
                  "Approve Booking"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <TabsContent value="overview" className="space-y-6">
        {/* Status Timeline */}
        <section className="rounded-2xl border border-border/70 bg-white/90 p-6 shadow-soft">
          <SectionHeading>Status timeline</SectionHeading>
          <div className="grid gap-4 sm:grid-cols-4">
            <div
              className={`rounded-2xl border p-4 text-sm shadow-soft ${
                booking.status === "Approved" ||
                booking.status === "Confirmed" ||
                booking.status === "DepositReceived" ||
                booking.status === "InProgress" ||
                booking.status === "Completed"
                  ? "bg-secondary border-secondary text-secondary-foreground"
                  : "bg-white border-border/70 text-text"
              }`}
            >
              <p className="font-semibold">Approved</p>
              <p className="text-xs opacity-80">
                {booking.status === "Approved" ||
                booking.status === "Confirmed" ||
                booking.status === "DepositReceived" ||
                booking.status === "InProgress" ||
                booking.status === "Completed"
                  ? new Date(booking.updated_at).toLocaleDateString()
                  : "Pending"}
              </p>
            </div>
            <div
              className={`rounded-2xl border p-4 text-sm shadow-soft ${
                booking.status === "Confirmed" ||
                booking.status === "InProgress" ||
                booking.status === "Completed"
                  ? "bg-secondary border-secondary text-secondary-foreground"
                  : "bg-white border-border/70 text-text"
              }`}
            >
              <p className="font-semibold">Confirmed</p>
              <p className="text-xs opacity-80">
                {booking.status === "Confirmed" ||
                booking.status === "InProgress" ||
                booking.status === "Completed"
                  ? booking.deposit_received_at
                    ? new Date(booking.deposit_received_at).toLocaleDateString()
                    : new Date(booking.updated_at).toLocaleDateString()
                  : "Pending"}
              </p>
            </div>
            <div
              className={`rounded-2xl border p-4 text-sm shadow-soft ${
                !booking.is_overnight
                  ? "bg-neutral text-text-light opacity-50 border-dashed border-border/70"
                  : rooms.length > 0
                  ? "bg-secondary border-secondary text-secondary-foreground"
                  : "bg-white border-border/70 text-text"
              }`}
            >
              <p className="font-semibold">Room List received</p>
              <p className="text-xs opacity-80">
                {!booking.is_overnight
                  ? "Not Applicable"
                  : rooms.length > 0
                  ? "Received"
                  : "Pending"}
              </p>
            </div>
            <div
              className={`rounded-2xl border p-4 text-sm shadow-soft ${
                !booking.catering_required
                  ? "bg-neutral text-text-light opacity-50 border-dashed border-border/70"
                  : mealJobs.length > 0
                  ? "bg-secondary border-secondary text-secondary-foreground"
                  : "bg-white border-border/70 text-text"
              }`}
            >
              <p className="font-semibold">Catering Selections received</p>
              <p className="text-xs opacity-80">
                {!booking.catering_required
                  ? "Not Applicable"
                  : mealJobs.length > 0
                  ? "Received"
                  : "Pending"}
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Primary Contact */}
          <section className="rounded-2xl border border-border/70 bg-white/90 p-6 shadow-soft">
            <SectionHeading>Primary Contact</SectionHeading>
            <div className="space-y-4">
              <DetailRow
                label="Name"
                value={booking.contact_name || booking.customer_name || "—"}
              />
              <DetailRow label="Phone" value={booking.contact_phone || "—"} />
              <DetailRow label="Email" value={booking.customer_email} />
            </div>
          </section>

          {/* Booking Details */}
          <section className="rounded-2xl border border-border/70 bg-white/90 p-6 shadow-soft">
            <SectionHeading>Booking Details</SectionHeading>
            <div className="space-y-4">
              <DetailRow label="Type" value={booking.booking_type} />
              <DetailRow label="Event Type" value={booking.event_type || "—"} />
              <DetailRow
                label="Headcount"
                value={booking.headcount.toString()}
              />
              <DetailRow label="Nights" value={booking.nights.toString()} />
              <DetailRow
                label="Overnight"
                value={booking.is_overnight ? "Yes" : "No"}
              />
              <DetailRow
                label="Catering"
                value={booking.catering_required ? "Required" : "Not required"}
              />
            </div>
          </section>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Financials */}
          <section className="rounded-2xl border border-border/70 bg-white/90 p-6 shadow-soft">
            <SectionHeading>Financials</SectionHeading>
            <div className="space-y-4">
              <DetailRow
                label="Deposit Status"
                value={booking.deposit_status}
              />
              <DetailRow
                label="Deposit Received"
                value={
                  booking.deposit_received_at
                    ? new Date(booking.deposit_received_at).toLocaleDateString()
                    : "—"
                }
              />
            </div>
          </section>

          {/* Notes */}
          <section className="rounded-2xl border border-border/70 bg-white/90 p-6 shadow-soft">
            <SectionHeading>Notes</SectionHeading>
            <div className="rounded-xl bg-neutral p-4 text-sm text-text">
              {booking.notes ? (
                <p className="whitespace-pre-wrap">{booking.notes}</p>
              ) : (
                <p className="text-text-light italic">No notes added.</p>
              )}
            </div>
          </section>
        </div>
      </TabsContent>

      <TabsContent value="spaces">
        <SpacesTab
          booking={booking}
          reservations={reservations}
          spaces={allSpaces}
          conflicts={conflicts}
          conflictingBookings={conflictingBookings}
        />
      </TabsContent>

      <TabsContent
        value="accommodation"
        className="space-y-6 rounded-2xl border border-border/70 bg-white/90 p-6 shadow-soft"
      >
        <section className="space-y-4">
          <SectionHeading>Room inventory</SectionHeading>
          <div className="grid gap-4 md:grid-cols-3">
            {rooms.length ? (
              rooms.map((room) => <RoomCard key={room.id} room={room} />)
            ) : (
              <p className="text-sm text-text-light">
                No room assignments yet.
              </p>
            )}
          </div>
        </section>
      </TabsContent>

      <TabsContent value="catering" className="space-y-6">
        <CateringTab 
          meals={mealJobs} 
          caterers={cateringOptions.caterers}
          menuItems={cateringOptions.menuItems}
        />
      </TabsContent>

      <TabsContent
        value="timeline"
        className="space-y-6 rounded-2xl border border-border/70 bg-white/90 p-6 shadow-soft"
      >
        <section className="space-y-4">
          <SectionHeading>Audit timeline</SectionHeading>
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

      <TabsContent
        value="docs"
        className="space-y-6 rounded-2xl border border-border/70 bg-white/90 p-6 shadow-soft"
      >
        <section className="space-y-4">
          <SectionHeading>Documents</SectionHeading>
          <div className="rounded-2xl border border-dashed border-border/70 bg-neutral p-4 text-sm text-text">
            Upload agreements, run sheets or insurance certificates for this
            booking.
          </div>
        </section>
      </TabsContent>
    </Tabs>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-light">
      {children}
    </h3>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 py-2 last:border-0">
      <span className="text-sm font-medium text-text-light">{label}</span>
      <span className="text-sm font-semibold text-text text-right">
        {value}
      </span>
    </div>
  );
}
