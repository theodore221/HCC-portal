"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateRange } from "@/lib/utils";
import type { BookingWithMeta } from "@/lib/queries/bookings";
import { ReactNode } from "react";

export function CustomerOverviewTab({ booking }: { booking: BookingWithMeta }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Booking Details */}
        <section className="rounded-2xl border border-border/70 bg-white/90 p-6 shadow-soft">
          <SectionHeading>Booking Details</SectionHeading>
          <div className="space-y-4">
            <DetailRow
              label="Dates"
              value={formatDateRange(
                booking.arrival_date,
                booking.departure_date
              )}
            />
            <DetailRow label="Duration" value={`${booking.nights} nights`} />
            <DetailRow label="Guests" value={booking.headcount} />
            <DetailRow label="Type" value={booking.booking_type} />
            <DetailRow label="Event Type" value={booking.event_type || "—"} />
          </div>
        </section>

        {/* Contact Information */}
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
      </div>

      {/* Financial Status */}
      <section className="rounded-2xl border border-border/70 bg-white/90 p-6 shadow-soft">
        <SectionHeading>Financial Status</SectionHeading>
        <div className="grid gap-6 md:grid-cols-3">
          <DetailRow
            label="Status"
            value={
              <Badge
                variant={
                  booking.status === "Approved" ||
                  booking.status === "Confirmed" ||
                  booking.status === "DepositReceived"
                    ? "default"
                    : "secondary"
                }
              >
                {booking.status}
              </Badge>
            }
          />
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
    </div>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h3>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
