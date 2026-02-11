"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  Mail,
  User,
  Building2,
  Calendar,
  Users,
  FileText,
  DollarSign,
  MessageSquare,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ExternalLink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EnquiryStatusChip } from "@/components/ui/enquiry-status-chip";
import { EnquiryNotesThread } from "@/components/enquiry/enquiry-notes-thread";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Enquiry, EnquiryNote, EnquiryQuote } from "@/lib/queries/enquiries";
import {
  updateEnquiryStatus,
  addEnquiryNote,
  createEnquiryQuote,
  acceptEnquiryQuote,
  markEnquiryAsLost,
  convertEnquiryToBooking,
} from "./actions";
import { LoadingOverlay } from "@/components/ui/loading-overlay";

interface EnquiryDetailClientProps {
  enquiry: Enquiry;
  notes: EnquiryNote[];
  quotes: EnquiryQuote[];
  currentUserName: string;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "TBD";
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

function formatCurrency(amount: number | null): string {
  if (!amount) return "—";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(amount);
}

export function EnquiryDetailClient({
  enquiry,
  notes,
  quotes,
  currentUserName,
}: EnquiryDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState("overview");

  // Dialog states
  const [isLostDialogOpen, setIsLostDialogOpen] = useState(false);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false);

  // Form states
  const [lostReason, setLostReason] = useState("");
  const [lostReasonOther, setLostReasonOther] = useState("");
  const [quoteData, setQuoteData] = useState({
    amount: "",
    description: "",
    notes: "",
    reasonForChange: "",
  });
  const [convertData, setConvertData] = useState({
    customer_name: enquiry.customer_name,
    customer_email: enquiry.customer_email,
    organization: enquiry.organization || "",
    discount_percentage: "",
    custom_pricing_notes: "",
  });

  // Handle status transitions
  const handleStatusChange = (newStatus: typeof enquiry.status) => {
    startTransition(async () => {
      await updateEnquiryStatus(enquiry.id, newStatus, enquiry.status);
      router.refresh();
    });
  };

  // Handle add note
  const handleAddNote = async (content: string, noteType: typeof notes[0]["note_type"]) => {
    await addEnquiryNote(enquiry.id, content, noteType);
    router.refresh();
  };

  // Handle create quote
  const handleCreateQuote = () => {
    startTransition(async () => {
      await createEnquiryQuote(enquiry.id, {
        amount: parseFloat(quoteData.amount),
        description: quoteData.description || undefined,
        notes: quoteData.notes || undefined,
        reasonForChange: quoteData.reasonForChange || undefined,
      });
      setIsQuoteDialogOpen(false);
      setQuoteData({ amount: "", description: "", notes: "", reasonForChange: "" });
      setActiveTab("quotes");
      router.refresh();
    });
  };

  // Handle accept quote
  const handleAcceptQuote = (quoteId: string) => {
    startTransition(async () => {
      await acceptEnquiryQuote(enquiry.id, quoteId);
      router.refresh();
    });
  };

  // Handle mark as lost
  const handleMarkAsLost = () => {
    const reason = lostReason === "Other" ? lostReasonOther : lostReason;
    startTransition(async () => {
      await markEnquiryAsLost(enquiry.id, reason);
      setIsLostDialogOpen(false);
      setLostReason("");
      setLostReasonOther("");
      router.refresh();
    });
  };

  // Handle convert to booking
  const handleConvertToBooking = () => {
    startTransition(async () => {
      const result = await convertEnquiryToBooking(enquiry.id, {
        customer_name: convertData.customer_name,
        customer_email: convertData.customer_email,
        organization: convertData.organization || undefined,
        discount_percentage: convertData.discount_percentage
          ? parseFloat(convertData.discount_percentage)
          : undefined,
        custom_pricing_notes: convertData.custom_pricing_notes || undefined,
      });
      setIsConvertDialogOpen(false);
      router.push(`/admin/bookings/${result.booking_id}`);
    });
  };

  // Get contextual actions based on status
  const getStatusActions = () => {
    switch (enquiry.status) {
      case "new":
        return (
          <Button onClick={() => handleStatusChange("in_discussion")}>
            Start Discussion
          </Button>
        );

      case "in_discussion":
        return (
          <>
            <Button onClick={() => setIsQuoteDialogOpen(true)}>
              <DollarSign className="h-4 w-4 mr-2" />
              Create Quote
            </Button>
            <Button variant="outline" onClick={() => setIsLostDialogOpen(true)}>
              <XCircle className="h-4 w-4 mr-2" />
              Mark as Lost
            </Button>
          </>
        );

      case "quoted":
        return (
          <>
            <Button onClick={() => handleStatusChange("ready_to_book")}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Ready to Book
            </Button>
            <Button variant="outline" onClick={() => setIsQuoteDialogOpen(true)}>
              Revise Quote
            </Button>
            <Button variant="outline" onClick={() => setIsLostDialogOpen(true)}>
              <XCircle className="h-4 w-4 mr-2" />
              Mark as Lost
            </Button>
          </>
        );

      case "ready_to_book":
        return (
          <>
            <Button onClick={() => setIsConvertDialogOpen(true)}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Convert to Booking
            </Button>
            <Button variant="outline" onClick={() => setIsLostDialogOpen(true)}>
              <XCircle className="h-4 w-4 mr-2" />
              Mark as Lost
            </Button>
          </>
        );

      case "converted_to_booking":
        return enquiry.converted_to_booking_id ? (
          <Button asChild>
            <Link href={`/admin/bookings/${enquiry.converted_to_booking_id}`}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View Booking
            </Link>
          </Button>
        ) : null;

      case "lost":
        return (
          <Button variant="outline" onClick={() => handleStatusChange("in_discussion")}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reopen
          </Button>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {isPending && <LoadingOverlay />}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/enquiries">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-olive-900">
                {enquiry.reference_number}
              </h1>
              <EnquiryStatusChip status={enquiry.status} />
            </div>
            <p className="mt-1 text-sm text-olive-600">
              {enquiry.customer_name}
              {enquiry.organization && ` • ${enquiry.organization}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">{getStatusActions()}</div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="notes">
            Notes & Activity
            <span className="ml-2 rounded-full bg-olive-100 px-2 py-0.5 text-xs">
              {notes.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="quotes">
            Quotes
            <span className="ml-2 rounded-full bg-olive-100 px-2 py-0.5 text-xs">
              {quotes.length}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-olive-600">Name</Label>
                  <p className="text-sm font-medium">{enquiry.customer_name}</p>
                </div>
                <div>
                  <Label className="text-xs text-olive-600">Email</Label>
                  <p className="text-sm">{enquiry.customer_email}</p>
                </div>
                {enquiry.customer_phone && (
                  <div>
                    <Label className="text-xs text-olive-600">Phone</Label>
                    <p className="text-sm">{enquiry.customer_phone}</p>
                  </div>
                )}
                {enquiry.organization && (
                  <div>
                    <Label className="text-xs text-olive-600">Organization</Label>
                    <p className="text-sm">{enquiry.organization}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Event Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Event Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-olive-600">Event Type</Label>
                  <p className="text-sm font-medium">{enquiry.event_type}</p>
                </div>
                <div>
                  <Label className="text-xs text-olive-600">Approximate Dates</Label>
                  <p className="text-sm">
                    {formatDate(enquiry.approximate_start_date)} →{" "}
                    {formatDate(enquiry.approximate_end_date)}
                  </p>
                </div>
                {enquiry.estimated_guests && (
                  <div>
                    <Label className="text-xs text-olive-600">Estimated Guests</Label>
                    <p className="text-sm">{enquiry.estimated_guests}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Message */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Enquiry Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-olive-800">{enquiry.message}</p>
            </CardContent>
          </Card>

          {/* Status Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Status Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {enquiry.quoted_amount && (
                <div>
                  <Label className="text-xs text-olive-600">Quoted Amount</Label>
                  <p className="text-lg font-semibold text-olive-900">
                    {formatCurrency(enquiry.quoted_amount)}
                  </p>
                </div>
              )}
              {enquiry.lost_reason && (
                <div>
                  <Label className="text-xs text-olive-600">Lost Reason</Label>
                  <p className="text-sm text-olive-800">{enquiry.lost_reason}</p>
                </div>
              )}
              {enquiry.admin_notes && (
                <div>
                  <Label className="text-xs text-olive-600">
                    Legacy Admin Notes
                  </Label>
                  <p className="whitespace-pre-wrap text-sm text-olive-700">
                    {enquiry.admin_notes}
                  </p>
                </div>
              )}
              <div>
                <Label className="text-xs text-olive-600">Created</Label>
                <p className="text-sm">{formatDate(enquiry.created_at)}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Activity Feed</CardTitle>
              <CardDescription>
                Track all notes, calls, emails, and status changes for this enquiry
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EnquiryNotesThread
                enquiryId={enquiry.id}
                notes={notes}
                onAddNote={handleAddNote}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quotes Tab */}
        <TabsContent value="quotes" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-olive-900">Quote Revisions</h2>
              <p className="text-sm text-olive-600">
                Track pricing evolution and customer acceptance
              </p>
            </div>
            <Button onClick={() => setIsQuoteDialogOpen(true)}>
              <DollarSign className="h-4 w-4 mr-2" />
              Create New Quote
            </Button>
          </div>

          {quotes.length > 0 ? (
            <div className="space-y-3">
              {[...quotes].reverse().map((quote) => (
                <Card key={quote.id} className={quote.is_accepted ? "border-emerald-300 bg-emerald-50" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">
                          Version {quote.version_number}
                          {quote.is_accepted && (
                            <span className="ml-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                              Accepted
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription>
                          Created by {quote.created_by_name} on {formatDate(quote.created_at)}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-olive-900">
                          {formatCurrency(quote.amount)}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {quote.description && (
                      <div>
                        <Label className="text-xs text-olive-600">Description</Label>
                        <p className="text-sm text-olive-800">{quote.description}</p>
                      </div>
                    )}
                    {quote.reason_for_change && (
                      <div>
                        <Label className="text-xs text-olive-600">Reason for Change</Label>
                        <p className="text-sm text-olive-800">{quote.reason_for_change}</p>
                      </div>
                    )}
                    {quote.notes && (
                      <div>
                        <Label className="text-xs text-olive-600">Internal Notes</Label>
                        <p className="text-sm text-olive-700">{quote.notes}</p>
                      </div>
                    )}
                    {!quote.is_accepted && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAcceptQuote(quote.id)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Mark as Accepted
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <DollarSign className="mx-auto h-12 w-12 text-olive-300" />
                <p className="mt-4 text-sm text-olive-600">
                  No quotes created yet. Create the first quote to start the pricing conversation.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Mark as Lost Dialog */}
      <Dialog open={isLostDialogOpen} onOpenChange={setIsLostDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Enquiry as Lost</DialogTitle>
            <DialogDescription>
              Please provide a reason for why this enquiry was not converted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reason</Label>
              <select
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                className="w-full rounded-md border border-olive-200 bg-white px-3 py-2 text-sm focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/20"
              >
                <option value="">Select a reason...</option>
                <option value="Too expensive">Too expensive</option>
                <option value="Chose another venue">Chose another venue</option>
                <option value="Dates unavailable">Dates unavailable</option>
                <option value="No response">No response</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {lostReason === "Other" && (
              <div>
                <Label>Please specify</Label>
                <Textarea
                  value={lostReasonOther}
                  onChange={(e) => setLostReasonOther(e.target.value)}
                  placeholder="Enter the reason..."
                  rows={3}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLostDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleMarkAsLost}
              disabled={!lostReason || (lostReason === "Other" && !lostReasonOther.trim())}
            >
              Mark as Lost
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Quote Dialog */}
      <Dialog open={isQuoteDialogOpen} onOpenChange={setIsQuoteDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {quotes.length === 0 ? "Create Quote" : "Create Revised Quote"}
            </DialogTitle>
            <DialogDescription>
              {quotes.length === 0
                ? "Create the first quote for this enquiry"
                : `Creating version ${quotes.length + 1}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Amount (AUD) *</Label>
              <Input
                type="number"
                step="0.01"
                value={quoteData.amount}
                onChange={(e) => setQuoteData({ ...quoteData, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={quoteData.description}
                onChange={(e) => setQuoteData({ ...quoteData, description: e.target.value })}
                placeholder="What does this quote cover?"
                rows={3}
              />
            </div>
            {quotes.length > 0 && (
              <div>
                <Label>Reason for Change *</Label>
                <Textarea
                  value={quoteData.reasonForChange}
                  onChange={(e) => setQuoteData({ ...quoteData, reasonForChange: e.target.value })}
                  placeholder="Why is this quote being revised?"
                  rows={2}
                />
              </div>
            )}
            <div>
              <Label>Internal Notes</Label>
              <Textarea
                value={quoteData.notes}
                onChange={(e) => setQuoteData({ ...quoteData, notes: e.target.value })}
                placeholder="Notes for staff (not visible to customer)"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateQuote}
              disabled={
                !quoteData.amount ||
                (quotes.length > 0 && !quoteData.reasonForChange.trim())
              }
            >
              Create Quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert to Booking Dialog */}
      <Dialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Convert to Booking</DialogTitle>
            <DialogDescription>
              Generate a custom booking link for this enquiry. The customer will receive an email with a link to complete their booking.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Customer Name *</Label>
              <Input
                value={convertData.customer_name}
                onChange={(e) => setConvertData({ ...convertData, customer_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Customer Email *</Label>
              <Input
                type="email"
                value={convertData.customer_email}
                onChange={(e) => setConvertData({ ...convertData, customer_email: e.target.value })}
              />
            </div>
            <div>
              <Label>Organization</Label>
              <Input
                value={convertData.organization}
                onChange={(e) => setConvertData({ ...convertData, organization: e.target.value })}
              />
            </div>
            <div>
              <Label>Discount Percentage (optional)</Label>
              <Input
                type="number"
                step="1"
                min="0"
                max="100"
                value={convertData.discount_percentage}
                onChange={(e) => setConvertData({ ...convertData, discount_percentage: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Custom Pricing Notes (optional)</Label>
              <Textarea
                value={convertData.custom_pricing_notes}
                onChange={(e) => setConvertData({ ...convertData, custom_pricing_notes: e.target.value })}
                placeholder="Special pricing considerations..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConvertDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConvertToBooking}
              disabled={!convertData.customer_name || !convertData.customer_email}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Convert to Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
