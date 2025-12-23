"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusChip } from "@/components/ui/status-chip";
import { Button } from "@/components/ui/button";
import { formatDateRange } from "@/lib/utils";
import type { EnrichedMealJob } from "@/lib/catering";
import { SpacesTab } from "@/app/(app)/(admin)/admin/bookings/[id]/spaces-tab";
import { CateringTab } from "@/app/(app)/(admin)/admin/bookings/[id]/catering-tab";
import { AccommodationTab } from "@/app/(app)/(admin)/admin/bookings/[id]/accommodation-tab";
import type {
  BookingWithMeta,
  RoomWithAssignments,
  Space,
  SpaceReservation,
} from "@/lib/queries/bookings";
import type { Views, Tables } from "@/lib/database.types";

// Room conflict type for accommodation tab
export interface RoomConflict {
  room_id: string;
  conflicts_with: string;
  conflicting_booking: {
    id: string;
    reference: string | null;
    status: string;
    customer_name: string | null;
    contact_name: string | null;
    arrival_date: string;
    departure_date: string;
  };
}

const tabConfig = [
  { value: "overview", label: "Overview" },
  { value: "spaces", label: "Spaces" },
  { value: "accommodation", label: "Accommodation" },
  { value: "catering", label: "Catering" },
];

export default function BookingDetailClient({
  booking,
  displayName,
  mealJobs,
  rooms,
  allRooms,
  allSpaces,
  reservations,
  conflicts,
  conflictingBookings,
  roomConflicts,
  roomConflictingBookings,
  cateringOptions,
  roomingGroups,
}: {
  booking: BookingWithMeta;
  displayName: string;
  mealJobs: EnrichedMealJob[];
  rooms: RoomWithAssignments[];
  allRooms: (Tables<"rooms"> & {
    room_types: Tables<"room_types"> | null;
    level?: string | null;
    room_number?: string | null;
    wing?: string | null;
  })[];
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
  roomConflicts: RoomConflict[];
  roomConflictingBookings: {
    id: string;
    reference: string | null;
    status: string;
    customer_name: string | null;
    contact_name: string | null;
    arrival_date: string;
    departure_date: string;
  }[];
  cateringOptions: {
    caterers: { id: string; name: string }[];
    menuItems: {
      id: string;
      label: string;
      catererId: string | null;
      mealType: string | null;
    }[];
  };
  roomingGroups: any[];
}) {
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
            <Button variant="outline" size="sm" asChild>
              <Link
                href={`/portal/${booking.reference ?? booking.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="gap-2"
              >
                Customer Portal
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
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

          {/* Booking Specifics */}
          <section className="rounded-2xl border border-border/70 bg-white/90 p-6 shadow-soft">
            <SectionHeading>Booking Specifics</SectionHeading>
            <div className="space-y-4">
              <DetailRow label="Type" value={booking.booking_type} />
              <DetailRow
                label="Headcount"
                value={`${booking.headcount} guests`}
              />
              <DetailRow
                label="Catering Required"
                value={
                  booking.catering_required ? "Yes (See Catering tab)" : "No"
                }
              />
            </div>
          </section>
        </div>

        {/* Financial Status */}
        <section className="rounded-2xl border border-border/70 bg-white/90 p-6 shadow-soft">
          <SectionHeading>Financial Status</SectionHeading>
          <div className="grid gap-6 md:grid-cols-3">
            <DetailRow
              label="Deposit Status"
              value={
                <Badge
                  variant={
                    booking.deposit_status === "Paid" ? "default" : "secondary"
                  }
                >
                  {booking.deposit_status}
                </Badge>
              }
            />
            <DetailRow
              label="Deposit Amount"
              value={
                booking.deposit_amount
                  ? `$${booking.deposit_amount.toLocaleString()}`
                  : "—"
              }
            />
          </div>
        </section>
      </TabsContent>

      <TabsContent value="spaces" className="space-y-6">
        <SpacesTab
          booking={booking}
          spaces={allSpaces}
          reservations={reservations}
          conflicts={conflicts}
          conflictingBookings={conflictingBookings}
        />
      </TabsContent>

      <TabsContent value="accommodation" className="space-y-6">
        <AccommodationTab
          booking={booking}
          rooms={rooms}
          allRooms={allRooms}
          roomingGroups={roomingGroups}
          roomConflicts={roomConflicts}
          roomConflictingBookings={roomConflictingBookings}
        />
      </TabsContent>

      <TabsContent value="catering" className="space-y-6">
        <CateringTab
          meals={mealJobs}
          caterers={cateringOptions.caterers}
          menuItems={cateringOptions.menuItems}
        />
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
    <div className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0">
      <span className="text-sm text-text-light">{label}</span>
      <span className="text-sm font-medium text-text">{value}</span>
    </div>
  );
}
