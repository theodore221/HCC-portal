"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Calendar,
  FileText,
  DollarSign,
  MessageSquare,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ExternalLink,
  Copy,
  ChevronDown,
  ChevronRight,
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
} from "@/components/ui/dialog";
import type { Enquiry, EnquiryNote, EnquiryQuote } from "@/lib/queries/enquiries";
import type { BookingSelections, DiscountConfig } from "@/lib/pricing/types";
import {
  updateEnquiryStatus,
  addEnquiryNote,
  acceptEnquiryQuote,
  markEnquiryAsLost,
  convertEnquiryToBooking,
} from "./actions";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { QuoteBuilder, type PricingReferenceData } from "./quote-builder";

interface EnquiryDetailClientProps {
  enquiry: Enquiry;
  notes: EnquiryNote[];
  quotes: EnquiryQuote[];
  pricingData: PricingReferenceData;
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

// ── Itemized line-items display ────────────────────────────────────────────────
function LineItemsBreakdown({ quote }: { quote: EnquiryQuote }) {
  const [expanded, setExpanded] = useState(false);
  if (!quote.line_items?.length) return null;

  const categories: { key: string; label: string }[] = [
    { key: "accommodation", label: "Accommodation" },
    { key: "venue", label: "Venue" },
    { key: "catering", label: "Catering" },
    { key: "extras", label: "Extras" },
  ];

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
      >
        {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        {expanded ? "Hide" : "View"} itemized breakdown
      </button>

      {expanded && (
        <div className="mt-3 rounded-lg border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-gray-50 text-gray-500">
                <th className="text-left px-3 py-2 font-medium">Item</th>
                <th className="text-right px-3 py-2 font-medium">Qty</th>
                <th className="text-right px-3 py-2 font-medium">Unit Price</th>
                <th className="text-right px-3 py-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(({ key, label }) => {
                const items = quote.line_items!.filter((i) => i.category === key);
                if (!items.length) return null;
                return (
                  <>
                    <tr key={`hdr-${key}`} className="bg-gray-50/50">
                      <td
                        colSpan={4}
                        className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500"
                      >
                        {label}
                      </td>
                    </tr>
                    {items.map((item, idx) => {
                      const hasDiscount =
                        item.discounted_total !== undefined && item.discounted_total !== item.total;
                      const displayTotal = item.discounted_total ?? item.total;
                      return (
                        <tr key={`${key}-${idx}`} className="border-b border-gray-100 last:border-0">
                          <td className="px-3 py-2 text-gray-700">{item.item}</td>
                          <td className="px-3 py-2 text-right text-gray-500">
                            {item.qty} {item.unit}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {hasDiscount ? (
                              <span>
                                <span className="text-gray-400 line-through mr-1">
                                  {formatCurrency(item.unit_price)}
                                </span>
                                <span className="text-emerald-700 font-medium">
                                  {formatCurrency(item.discounted_unit_price ?? item.unit_price)}
                                </span>
                              </span>
                            ) : (
                              <span className="text-gray-500">{formatCurrency(item.unit_price)}</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {hasDiscount ? (
                              <span>
                                <span className="text-gray-400 line-through mr-1">
                                  {formatCurrency(item.total)}
                                </span>
                                <span className="text-emerald-700 font-medium">
                                  {formatCurrency(displayTotal)}
                                </span>
                              </span>
                            ) : (
                              <span className="text-gray-700">{formatCurrency(displayTotal)}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function EnquiryDetailClient({
  enquiry,
  notes,
  quotes,
  pricingData,
}: EnquiryDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState("overview");

  // Dialog / sheet states
  const [isLostDialogOpen, setIsLostDialogOpen] = useState(false);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [isQuoteSheetOpen, setIsQuoteSheetOpen] = useState(false);
  // Increment to remount QuoteBuilder with fresh state each time it opens
  const [quoteBuilderKey, setQuoteBuilderKey] = useState(0);

  // Duplicate quote state — set when clicking "Duplicate as New"
  const [duplicateFrom, setDuplicateFrom] = useState<{
    selections: BookingSelections | null;
    discountConfig: DiscountConfig | null;
  } | null>(null);

  // Form states
  const [lostReason, setLostReason] = useState("");
  const [lostReasonOther, setLostReasonOther] = useState("");
  const [convertData, setConvertData] = useState({
    customer_name: enquiry.customer_name,
    customer_email: enquiry.customer_email,
    organization: enquiry.organization || "",
    custom_pricing_notes: "",
  });

  const acceptedQuote = quotes.find((q) => q.is_accepted);

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

  // Open quote builder for a new quote (no pre-fill)
  const handleOpenQuoteBuilder = () => {
    setDuplicateFrom(null);
    setQuoteBuilderKey((k) => k + 1);
    setIsQuoteSheetOpen(true);
  };

  // Open quote builder pre-filled with an existing quote's data
  const handleDuplicateQuote = (quote: EnquiryQuote) => {
    setDuplicateFrom({
      selections: quote.selections,
      discountConfig: quote.discount_config,
    });
    setQuoteBuilderKey((k) => k + 1);
    setIsQuoteSheetOpen(true);
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
            <Button onClick={handleOpenQuoteBuilder}>
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
            <Button onClick={() => setIsConvertDialogOpen(true)}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Convert to Booking
            </Button>
            <Button variant="outline" onClick={handleOpenQuoteBuilder}>
              Revise Quote
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
              <h1 className="text-2xl font-bold text-gray-900">
                {enquiry.reference_number}
              </h1>
              <EnquiryStatusChip status={enquiry.status} />
            </div>
            <p className="mt-1 text-sm text-gray-500">
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
            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
              {notes.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="quotes">
            Quotes
            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
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
                  <Label className="text-xs text-gray-500">Name</Label>
                  <p className="text-sm font-medium">{enquiry.customer_name}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Email</Label>
                  <p className="text-sm">{enquiry.customer_email}</p>
                </div>
                {enquiry.customer_phone && (
                  <div>
                    <Label className="text-xs text-gray-500">Phone</Label>
                    <p className="text-sm">{enquiry.customer_phone}</p>
                  </div>
                )}
                {enquiry.organization && (
                  <div>
                    <Label className="text-xs text-gray-500">Organization</Label>
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
                  <Label className="text-xs text-gray-500">Event Type</Label>
                  <p className="text-sm font-medium">{enquiry.event_type}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Approximate Dates</Label>
                  <p className="text-sm">
                    {formatDate(enquiry.approximate_start_date)} →{" "}
                    {formatDate(enquiry.approximate_end_date)}
                  </p>
                </div>
                {enquiry.estimated_guests && (
                  <div>
                    <Label className="text-xs text-gray-500">Estimated Guests</Label>
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
              <p className="whitespace-pre-wrap text-sm text-gray-700">{enquiry.message}</p>
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
                  <Label className="text-xs text-gray-500">Quoted Amount</Label>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(enquiry.quoted_amount)}
                  </p>
                </div>
              )}
              {enquiry.lost_reason && (
                <div>
                  <Label className="text-xs text-gray-500">Lost Reason</Label>
                  <p className="text-sm text-gray-700">{enquiry.lost_reason}</p>
                </div>
              )}
              {enquiry.admin_notes && (
                <div>
                  <Label className="text-xs text-gray-500">Legacy Admin Notes</Label>
                  <p className="whitespace-pre-wrap text-sm text-gray-600">
                    {enquiry.admin_notes}
                  </p>
                </div>
              )}
              <div>
                <Label className="text-xs text-gray-500">Created</Label>
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
              <h2 className="text-lg font-semibold text-gray-900">Quote Revisions</h2>
              <p className="text-sm text-gray-500">
                Track pricing evolution and customer acceptance
              </p>
            </div>
            <Button onClick={handleOpenQuoteBuilder}>
              <DollarSign className="h-4 w-4 mr-2" />
              Create New Quote
            </Button>
          </div>

          {quotes.length > 0 ? (
            <div className="space-y-3">
              {[...quotes].reverse().map((quote) => (
                <Card
                  key={quote.id}
                  className={quote.is_accepted ? "border-emerald-300 bg-emerald-50" : ""}
                >
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
                          {quote.line_items && (
                            <span className="ml-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                              Itemized
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription>
                          Created by {quote.created_by_name} on {formatDate(quote.created_at)}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(quote.amount)}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {quote.description && (
                      <div>
                        <Label className="text-xs text-gray-500">Description</Label>
                        <p className="text-sm text-gray-700">{quote.description}</p>
                      </div>
                    )}
                    {quote.reason_for_change && (
                      <div>
                        <Label className="text-xs text-gray-500">Reason for Change</Label>
                        <p className="text-sm text-gray-700">{quote.reason_for_change}</p>
                      </div>
                    )}
                    {quote.notes && (
                      <div>
                        <Label className="text-xs text-gray-500">Internal Notes</Label>
                        <p className="text-sm text-gray-600">{quote.notes}</p>
                      </div>
                    )}

                    {/* Itemized breakdown toggle */}
                    <LineItemsBreakdown quote={quote} />

                    <div className="flex gap-2 flex-wrap">
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
                      {quote.selections && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicateQuote(quote)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate as New
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <DollarSign className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-4 text-sm text-gray-500">
                  No quotes created yet. Create the first quote to start the pricing conversation.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Quote Builder Sheet — keyed so it remounts fresh on each open ── */}
      <QuoteBuilder
        key={quoteBuilderKey}
        open={isQuoteSheetOpen}
        onOpenChange={setIsQuoteSheetOpen}
        enquiry={enquiry}
        pricingData={pricingData}
        existingQuotesCount={quotes.length}
        initialSelections={duplicateFrom?.selections}
        initialDiscountConfig={duplicateFrom?.discountConfig}
        onQuoteCreated={() => {
          setActiveTab("quotes");
          router.refresh();
        }}
      />

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
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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

      {/* Convert to Booking Dialog */}
      <Dialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Convert to Booking</DialogTitle>
            <DialogDescription>
              Generate a custom booking link for this enquiry. The customer will receive an email
              with a link to complete their booking.
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
                onChange={(e) =>
                  setConvertData({ ...convertData, customer_email: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Organization</Label>
              <Input
                value={convertData.organization}
                onChange={(e) => setConvertData({ ...convertData, organization: e.target.value })}
              />
            </div>

            {/* Show discount summary from accepted quote if available */}
            {acceptedQuote?.discount_config && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-medium text-emerald-800 mb-2">
                  Pricing discounts from accepted quote will carry through:
                </p>
                {acceptedQuote.discount_config.item_overrides?.map((ov, i) => (
                  <p key={i} className="text-xs text-emerald-700">
                    • {ov.item}: overridden to ${ov.new_unit_price}/unit
                  </p>
                ))}
                {acceptedQuote.discount_config.percentage && (
                  <p className="text-xs text-emerald-700">
                    • {acceptedQuote.discount_config.percentage}% off all items
                  </p>
                )}
              </div>
            )}

            <div>
              <Label>Custom Pricing Notes (optional)</Label>
              <Textarea
                value={convertData.custom_pricing_notes}
                onChange={(e) =>
                  setConvertData({ ...convertData, custom_pricing_notes: e.target.value })
                }
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
