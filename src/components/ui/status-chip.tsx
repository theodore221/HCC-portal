import { BookingStatus } from "@/lib/mock-data";
import { Badge } from "./badge";

const statusCopy: Record<BookingStatus, string> = {
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
  return <Badge label={statusCopy[status]} />;
}
