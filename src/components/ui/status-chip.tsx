import type { ComponentProps } from "react";
import { Badge } from "./badge";
import { BookingStatus } from "@/lib/mock-data";

const variantForStatus: Record<
  BookingStatus,
  ComponentProps<typeof Badge>["variant"]
> = {
  Pending: "warning",
  InTriage: "outline",
  Approved: "success",
  DepositPending: "warning",
  DepositReceived: "success",
  InProgress: "default",
  Completed: "neutral",
  Cancelled: "danger",
};

const labelForStatus: Record<BookingStatus, string> = {
  Pending: "Pending",
  InTriage: "In Triage",
  Approved: "Approved",
  DepositPending: "Deposit Pending",
  DepositReceived: "Deposit Received",
  InProgress: "In Progress",
  Completed: "Completed",
  Cancelled: "Cancelled",
};

export function StatusChip({ status }: { status: BookingStatus }) {
  return <Badge variant={variantForStatus[status]}>{labelForStatus[status]}</Badge>;
}
