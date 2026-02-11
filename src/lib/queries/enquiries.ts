import {
  Sparkles,
  MessageCircle,
  DollarSign,
  CheckCircle2,
  ArrowRightCircle,
  XCircle
} from "lucide-react";

/**
 * Enquiry status types and configuration
 */
export type EnquiryStatus =
  | "new"
  | "in_discussion"
  | "quoted"
  | "ready_to_book"
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
}

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
    className: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Sparkles,
  },
  in_discussion: {
    label: "In Discussion",
    className: "bg-amber-100 text-amber-800 border-amber-200",
    icon: MessageCircle,
  },
  quoted: {
    label: "Quoted",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: DollarSign,
  },
  ready_to_book: {
    label: "Ready to Book",
    className: "bg-olive-100 text-olive-800 border-olive-200",
    icon: CheckCircle2,
  },
  converted_to_booking: {
    label: "Converted",
    className: "bg-purple-100 text-purple-800 border-purple-200",
    icon: ArrowRightCircle,
  },
  lost: {
    label: "Lost",
    className: "bg-neutral-100 text-neutral-600 border-neutral-200",
    icon: XCircle,
  },
};

/**
 * Helper to get status config
 */
export function getEnquiryStatusConfig(status: EnquiryStatus) {
  return ENQUIRY_STATUS_CONFIG[status];
}
