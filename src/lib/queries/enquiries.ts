import {
  Sparkles,
  MessageCircle,
  DollarSign,
  ArrowRightCircle,
  XCircle
} from "lucide-react";
import type { BookingSelections, PricingLineItem, DiscountConfig, PriceTableSnapshot } from "@/lib/pricing/types";

/**
 * Enquiry status types and configuration
 */
export type EnquiryStatus =
  | "new"
  | "in_discussion"
  | "quoted"
  | "converted_to_booking"
  | "lost";

export type NoteType =
  | "note"
  | "phone_call"
  | "email"
  | "status_change"
  | "quote_created"
  | "system";

/**
 * Enquiry interfaces (manual types since enquiries table isn't in database.types.ts)
 */
export interface Enquiry {
  id: string;
  reference_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  organization: string | null;
  event_type: string;
  approximate_start_date: string | null;
  approximate_end_date: string | null;
  estimated_guests: number | null;
  message: string;
  status: EnquiryStatus;
  admin_notes: string | null;
  quoted_amount: number | null;
  lost_reason: string | null;
  converted_to_booking_id: string | null;
  created_at: string;
  updated_at: string;
  submitted_from_ip: string | null;
  submission_duration_seconds: number | null;
}

export interface EnquiryNote {
  id: string;
  enquiry_id: string;
  author_id: string;
  author_name: string;
  note_type: NoteType;
  content: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface EnquiryQuote {
  id: string;
  enquiry_id: string;
  version_number: number;
  amount: number;
  description: string | null;
  notes: string | null;
  reason_for_change: string | null;
  is_accepted: boolean;
  created_by: string;
  created_by_name: string;
  created_at: string;
  // Itemized quote data (null for legacy flat-amount quotes)
  selections: BookingSelections | null;
  line_items: PricingLineItem[] | null;
  discount_config: DiscountConfig | null;
  price_snapshot: PriceTableSnapshot | null;
}

export type { BookingSelections, PricingLineItem, DiscountConfig, PriceTableSnapshot };

/**
 * Status configuration for UI rendering
 */
export const ENQUIRY_STATUS_CONFIG: Record<
  EnquiryStatus,
  {
    label: string;
    className: string;
    icon: typeof Sparkles;
  }
> = {
  new: {
    label: "New",
    className: "border-status-slate/20 bg-status-slate/10 text-status-slate",
    icon: Sparkles,
  },
  in_discussion: {
    label: "In Discussion",
    className: "border-status-ochre/20 bg-status-ochre/10 text-status-ochre",
    icon: MessageCircle,
  },
  quoted: {
    label: "Quoted",
    className: "border-status-forest/20 bg-status-forest/10 text-status-forest",
    icon: DollarSign,
  },
  converted_to_booking: {
    label: "Converted",
    className: "border-status-plum/20 bg-status-plum/10 text-status-plum",
    icon: ArrowRightCircle,
  },
  lost: {
    label: "Lost",
    className: "border-status-stone/20 bg-status-stone/10 text-status-stone",
    icon: XCircle,
  },
};

/**
 * Helper to get status config
 */
export function getEnquiryStatusConfig(status: EnquiryStatus) {
  return ENQUIRY_STATUS_CONFIG[status];
}
