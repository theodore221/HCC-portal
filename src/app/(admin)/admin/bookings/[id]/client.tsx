"use client";

import type { ReactNode } from "react";
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
  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <Card className="shadow-soft">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold text-text">{displayName}</CardTitle>
            <CardDescription className="text-sm text-text-light">
              {formatDateRange(booking.arrival_date, booking.departure_date)} · {booking.headcount} guests
            </CardDescription>
          </div>
          <StatusChip status={booking.status} />
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      <TabsContent value="overview" className="space-y-8 rounded-2xl border border-border/70 bg-white/90 p-6 shadow-soft">
        <section>
          <SectionHeading>Status timeline</SectionHeading>
          <div className="grid gap-4 sm:grid-cols-3">
            {["Pending", "Approved", "Deposit received"].map((stage) => (
              <div
                key={stage}
                className="rounded-2xl border border-border/70 bg-white p-4 text-sm text-text shadow-soft"
              >
                <p className="font-semibold text-text">{stage}</p>
                <p className="text-xs text-text-light">Date placeholder</p>
              </div>
            ))}
          </div>
        </section>
        <section>
          <SectionHeading>Summary</SectionHeading>
          <div className="grid gap-4 md:grid-cols-3">
            <InfoBlock label="Reference" value={booking.reference ?? "—"} />
            <InfoBlock
              label="Overnight"
              value={booking.is_overnight ? "Yes" : "No"}
            />
            <InfoBlock
              label="Catering"
              value={booking.catering_required ? "Required" : "Not required"}
            />
            <InfoBlock label="Spaces" value={booking.spaces.join(", ") || "None"} />
            <InfoBlock
              label="Conflicts"
              value={booking.conflicts.length ? booking.conflicts.join(", ") : "None"}
            />
          </div>
        </section>
      </TabsContent>

      <TabsContent value="triage" className="space-y-8 rounded-2xl border border-border/70 bg-white/90 p-6 shadow-soft">
        <section>
          <SectionHeading>Conflict review</SectionHeading>
          <ConflictBanner issues={booking.conflicts} />
        </section>
        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-neutral p-4">
            <p className="text-sm font-semibold text-text">Requested spaces</p>
            <ul className="mt-3 space-y-2 text-sm text-text">
              {booking.spaces.length ? (
                booking.spaces.map((space) => (
                  <li key={space} className="flex items-center justify-between text-text">
                    <span>{space}</span>
                    <span className="text-xs text-text-light">Hold confirmed</span>
                  </li>
                ))
              ) : (
                <li className="text-xs text-text-light">No spaces assigned yet.</li>
              )}
            </ul>
          </div>
          <details className="rounded-2xl border border-border/70 bg-neutral p-4">
            <summary className="cursor-pointer text-sm font-semibold text-text">
              Capacity &amp; warnings
            </summary>
            <ul className="mt-3 space-y-2 text-sm text-text">
              <li>
                Headcount {booking.headcount} vs beds 80 ·{" "}
                <span className="font-semibold text-success">OK</span>
              </li>
              {booking.conflicts.map((conflict) => (
                <li key={conflict}>{conflict}</li>
              ))}
              {!booking.conflicts.length && <li>No conflicts detected.</li>}
            </ul>
          </details>
        </section>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline">Mark as In Triage</Button>
          <Button>Approve booking</Button>
          <Button variant="ghost">Record deposit</Button>
        </div>
      </TabsContent>

      <TabsContent value="spaces" className="space-y-6 rounded-2xl border border-border/70 bg-white/90 p-6 shadow-soft">
        <section>
          <SectionHeading>Spaces timeline</SectionHeading>
          <div className="rounded-2xl border border-border/70 bg-neutral p-4 text-sm text-text">
            Timeline visual placeholder showing holds per day.
          </div>
        </section>
      </TabsContent>

      <TabsContent value="accommodation" className="space-y-6 rounded-2xl border border-border/70 bg-white/90 p-6 shadow-soft">
        <section className="space-y-4">
          <SectionHeading>Room inventory</SectionHeading>
          <div className="grid gap-4 md:grid-cols-3">
            {rooms.length ? (
              rooms.map((room) => <RoomCard key={room.id} room={room} />)
            ) : (
              <p className="text-sm text-text-light">No room assignments yet.</p>
            )}
          </div>
        </section>
      </TabsContent>

      <TabsContent value="catering" className="space-y-6 rounded-2xl border border-border/70 bg-white/90 p-6 shadow-soft">
        <section className="space-y-4">
          <SectionHeading>Meal plan</SectionHeading>
          <div className="grid gap-4 md:grid-cols-2">
            {mealJobs.length ? (
              mealJobs.map((job) => <MealSlotCard key={job.id} job={job} />)
            ) : (
              <p className="text-sm text-text-light">No catering services scheduled.</p>
            )}
          </div>
        </section>
      </TabsContent>

      <TabsContent value="timeline" className="space-y-6 rounded-2xl border border-border/70 bg-white/90 p-6 shadow-soft">
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

      <TabsContent value="docs" className="space-y-6 rounded-2xl border border-border/70 bg-white/90 p-6 shadow-soft">
        <section className="space-y-4">
          <SectionHeading>Documents</SectionHeading>
          <div className="rounded-2xl border border-dashed border-border/70 bg-neutral p-4 text-sm text-text">
            Upload agreements, run sheets or insurance certificates for this booking.
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

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1 rounded-2xl border border-border/60 bg-neutral p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-light">{label}</p>
      <p className="text-sm font-medium text-text">{value}</p>
    </div>
  );
}
