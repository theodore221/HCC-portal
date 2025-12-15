"use client";

import { useTransition, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Trash2,
  XCircle,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusChip } from "@/components/ui/status-chip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

import { AuditTimeline } from "@/components/ui/audit-timeline";
import { RoomCard } from "@/components/ui/room-card";
import { Button } from "@/components/ui/button";
import { formatDateRange, cn } from "@/lib/utils";
import type { EnrichedMealJob } from "@/lib/catering";
import { SpacesTab } from "./spaces-tab";
import { CateringTab } from "./catering-tab";
import { AccommodationTab } from "./accommodation-tab";
import { updateBookingStatus, recordDeposit, deleteBooking } from "./actions";
import type {
  BookingWithMeta,
  RoomWithAssignments,
  Space,
  SpaceReservation,
} from "@/lib/queries/bookings";
import type { Views, Tables } from "@/lib/database.types";

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
  allRooms,
  allSpaces,
  reservations,
  conflicts,
  conflictingBookings,
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
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [cancelReason, setCancelReason] = useState<string>("");
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

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

  const handleCancel = () => {
    if (!cancelReason) return;

    startTransition(async () => {
      try {
        await updateBookingStatus(booking.id, "Cancelled", cancelReason);
        setIsCancelOpen(false);
        toast({
          title: "Booking Cancelled",
          description: "The booking has been successfully cancelled.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to cancel booking. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteBooking(booking.id);
        setIsDeleteOpen(false);
        toast({
          title: "Booking Deleted",
          description:
            "The booking and all related records have been permanently deleted.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete booking. Please try again.",
          variant: "destructive",
        });
      }
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
                  booking.status === "Cancelled" ||
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

              <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                    disabled={booking.status === "Cancelled"}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Booking
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cancel Booking</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to cancel this booking? This action
                      will change the status to Cancelled.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="reason">Cancellation Reason</Label>
                      <Select
                        value={cancelReason}
                        onValueChange={setCancelReason}
                      >
                        <SelectTrigger id="reason">
                          <SelectValue placeholder="Select a reason" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="Too expensive">
                            Too expensive
                          </SelectItem>
                          <SelectItem value="Postponed">Postponed</SelectItem>
                          <SelectItem value="Mistake">Mistake</SelectItem>
                          <SelectItem value="Space not available">
                            Space not available
                          </SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter className="sm:justify-center">
                    <Button
                      variant="outline"
                      onClick={() => setIsCancelOpen(false)}
                    >
                      Keep Booking
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleCancel}
                      disabled={!cancelReason || isPending}
                    >
                      {isPending ? "Cancelling..." : "Confirm Cancellation"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-neutral-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-red-600 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Delete Booking
                    </DialogTitle>
                    <DialogDescription>
                      Are you sure you want to permanently delete this booking?
                      This action cannot be undone and will remove all related
                      records (meals, reservations, etc.).
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsDeleteOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={isPending}
                    >
                      {isPending ? "Deleting..." : "Delete Permanently"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
            {/* <DetailRow
              label="Payment Method"
              value={booking.payment_method || "—"}
            /> */}
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
        />
      </TabsContent>

      <TabsContent value="catering" className="space-y-6">
        <CateringTab
          meals={mealJobs}
          caterers={cateringOptions.caterers}
          menuItems={cateringOptions.menuItems}
        />
      </TabsContent>

      <TabsContent value="timeline" className="space-y-6">
        {/* TODO: Fetch and pass actual audit events */}
        <AuditTimeline events={[]} />
      </TabsContent>

      <TabsContent value="docs" className="space-y-6">
        <div className="rounded-2xl border border-border/70 bg-white/90 p-12 text-center shadow-soft">
          <p className="text-text-light">Document management coming soon...</p>
        </div>
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
