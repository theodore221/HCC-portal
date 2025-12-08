"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusChip } from "@/components/ui/status-chip";
import { Button } from "@/components/ui/button";
import { MealSlotCard } from "@/components/ui/meal-slot-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RoomingGroupBuilder } from "./rooming-group-builder";
import { getBookingDisplayName } from "@/lib/queries/bookings";
import type { BookingWithMeta, DietaryProfile } from "@/lib/queries/bookings";
import type { EnrichedMealJob } from "@/lib/catering";
import type { Tables } from "@/lib/database.types";

interface CustomerPortalClientProps {
  booking: BookingWithMeta;
  cateringJobs: EnrichedMealJob[];
  dietaryProfiles: DietaryProfile[];
  roomingGroups: Tables<"rooming_groups">[];
  unassignedGuests: { id: string; name: string }[];
  allGuests: { id: string; name: string }[];
  roomTypes: { id: string; name: string }[];
}

export default function CustomerPortalClient({
  booking,
  cateringJobs,
  dietaryProfiles,
  roomingGroups,
  unassignedGuests,
  allGuests,
  roomTypes,
}: CustomerPortalClientProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-olive-900">
            {getBookingDisplayName(booking)}
          </h1>
          <p className="text-olive-600">
            Reference: {booking.reference ?? booking.id}
          </p>
        </div>
        <StatusChip status={booking.status} />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="catering">Catering</TabsTrigger>
          <TabsTrigger value="rooming">Rooming</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Booking Overview</CardTitle>
              <CardDescription>
                {booking.headcount} guests · {booking.nights} nights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <section className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-olive-600">
                  Deposit instructions
                </h3>
                <p className="text-sm leading-relaxed text-olive-800">
                  A $1,500 deposit is required to secure your dates. Transfer to
                  the Holy Cross Centre account and include your booking
                  reference. Once finance confirms payment your catering and
                  rooming steps unlock automatically.
                </p>
                <div className="grid gap-3 rounded-xl border border-olive-100 bg-white p-4 sm:grid-cols-2">
                  <InfoBlock label="Bank" value="Holy Cross Centre" />
                  <InfoBlock label="BSB" value="033-123" />
                  <InfoBlock label="Account" value="124 567 890" />
                  <InfoBlock
                    label="Reference"
                    value={booking.reference ?? booking.id}
                  />
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-olive-600">
                  Summary & Submit
                </h3>
                <p className="text-sm text-olive-800">
                  Review your selections. Changes remain available until 7 days
                  prior to arrival. After that window contact the HCC team for
                  adjustments.
                </p>
                <Button className="w-full md:w-auto">Submit updates</Button>
              </section>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="catering" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Catering Planner</CardTitle>
              <CardDescription>
                Select meals for each day. Totals automatically validate against
                your headcount.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <section className="space-y-3">
                <div className="grid gap-4 md:grid-cols-2">
                  {cateringJobs.length ? (
                    cateringJobs.map((job) => (
                      <MealSlotCard key={job.id} job={job} />
                    ))
                  ) : (
                    <p className="text-sm text-olive-700">
                      No catering services scheduled.
                    </p>
                  )}
                </div>
                <Button className="w-full md:w-auto" variant="outline">
                  Add dietary note
                </Button>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-olive-600">
                  Dietary register
                </h3>
                <div className="overflow-hidden rounded-2xl border border-olive-100 bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Guest</TableHead>
                        <TableHead>Diet type</TableHead>
                        <TableHead>Allergy</TableHead>
                        <TableHead>Severity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dietaryProfiles.length ? (
                        dietaryProfiles.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium text-olive-900">
                              {item.person_name}
                            </TableCell>
                            <TableCell>{item.diet_type}</TableCell>
                            <TableCell>{item.allergy || "—"}</TableCell>
                            <TableCell>
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  item.severity === "Fatal"
                                    ? "bg-red-100 text-red-700"
                                    : item.severity === "High"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-olive-100 text-olive-800"
                                }`}
                              >
                                {item.severity ?? "Unknown"}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center text-sm text-olive-700"
                          >
                            No dietary profiles recorded yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </section>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rooming" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rooming Planner</CardTitle>
              <CardDescription>
                Drag and drop guests to assign them to rooms.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RoomingGroupBuilder
                bookingId={booking.id}
                initialGroups={roomingGroups.map((g) => ({
                  ...g,
                  members: g.members ?? [],
                  status: g.status ?? "draft", // Ensure status is string
                }))}
                unassignedGuests={unassignedGuests}
                allGuests={allGuests}
                roomTypes={roomTypes}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-olive-600">{label}</p>
      <p className="text-sm font-medium text-olive-900">{value}</p>
    </div>
  );
}
