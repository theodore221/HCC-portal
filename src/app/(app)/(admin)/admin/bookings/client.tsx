"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpRight,
  Bed,
  CheckCircle2,
  Filter,
  Search,
  SlidersHorizontal,
  Sparkles,
  AlertTriangle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { StatusChip } from "@/components/ui/status-chip";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import {
  getBookingDisplayName,
  type BookingStatus,
  type BookingWithMeta,
} from "@/lib/queries/bookings";
import { cn } from "@/lib/utils";

const statusOptions: { label: string; value: BookingStatus }[] = [
  { label: "Pending", value: "Pending" },
  { label: "Approved", value: "Approved" },
  { label: "Confirmed", value: "Confirmed" },
  { label: "Deposit received", value: "DepositReceived" },
  { label: "In progress", value: "InProgress" },
  { label: "Completed", value: "Completed" },
  { label: "Cancelled", value: "Cancelled" },
];

const statusBadgeStyles: Partial<Record<BookingStatus, string>> = {
  Pending: "border-warning/20 bg-warning/10 text-warning",
  InTriage: "border-primary/20 bg-primary/10 text-primary",
  Approved: "border-success/20 bg-success/10 text-success",
  Confirmed: "border-success/20 bg-success/10 text-success",
  DepositPending: "border-warning/20 bg-warning/10 text-warning",
  DepositReceived: "border-success/20 bg-success/10 text-success",
  InProgress: "border-primary/20 bg-primary/10 text-primary",
  Completed: "border-border/60 bg-neutral text-text",
  Cancelled: "border-danger/20 bg-danger/10 text-danger",
};

function formatDateRangeLabel(arrival: string, departure: string) {
  const formatter = new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const parseLocalDate = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const start = formatter.format(parseLocalDate(arrival));
  const end = formatter.format(parseLocalDate(departure));

  return start === end ? start : `${start} → ${end}`;
}

const columns: ColumnDef<BookingWithMeta>[] = [
  {
    accessorKey: "arrival_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Dates" />
    ),
    cell: ({ row }) => (
      <div className="flex flex-col text-sm text-text">
        <span className="font-medium">
          {formatDateRangeLabel(
            row.original.arrival_date,
            row.original.departure_date
          )}
        </span>
        <span className="text-xs font-semibold text-primary">
          {row.original.nights} nights
        </span>
      </div>
    ),
    sortingFn: "datetime",
  },
  {
    accessorKey: "customer_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Group" />
    ),
    cell: ({ row }) => (
      <div className="flex flex-col gap-1.5 text-sm text-text">
        <span className="font-medium">
          {getBookingDisplayName(row.original)}
        </span>
        {row.original.is_overnight && (
          <Badge
            variant="secondary"
            className="w-fit gap-1.5 bg-primary/10 px-2 py-0.5 text-primary hover:bg-primary/10"
          >
            <Bed className="size-3.5" />
            <span className="text-[11px] font-semibold">Overnight</span>
          </Badge>
        )}
      </div>
    ),
    filterFn: (row, _columnId, filterValue) => {
      if (!filterValue) return true;
      const value = (filterValue as string).toLowerCase();
      const booking = row.original;
      const query = (filterValue as string).toLowerCase();

      // Group Name: Starts with
      const displayName = getBookingDisplayName(booking).toLowerCase();
      if (displayName.startsWith(query)) return true;

      // Contact Name: First or Last name starts with
      const contactName = booking.contact_name?.toLowerCase() ?? "";
      if (contactName) {
        const parts = contactName.split(/\s+/);
        if (parts.some((part) => part.startsWith(query))) return true;
      }

      // Reference: Includes (keep existing behavior for flexibility)
      const reference = booking.reference?.toLowerCase() ?? "";
      return reference.includes(query);
    },
  },
  {
    accessorKey: "contact_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Contact" />
    ),
    cell: ({ row }) => (
      <div className="flex flex-col text-sm text-text">
        <span>{row.original.contact_name || "—"}</span>
        {row.original.contact_phone && (
          <span className="text-xs text-text-light">
            {row.original.contact_phone}
          </span>
        )}
      </div>
    ),
    meta: "hidden md:table-cell",
  },
  {
    accessorKey: "headcount",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Headcount"
        className="justify-center"
      />
    ),
    cell: ({ row }) => (
      <div className="text-center text-sm font-semibold text-text">
        {row.original.headcount}
      </div>
    ),
    enableColumnFilter: false,
    meta: "hidden sm:table-cell text-center",
  },
  {
    id: "spaces",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Spaces" />
    ),
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1.5">
        {row.original.spaces.map((space) => (
          <Badge
            key={`${row.original.id}-${space}`}
            variant="secondary"
            className="bg-neutral px-2.5 py-1 text-xs font-medium text-text-light hover:bg-neutral"
          >
            {space}
          </Badge>
        ))}
        {row.original.spaces.length === 0 && (
          <span className="text-xs text-text-light">None</span>
        )}
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "catering_required",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Catering" />
    ),
    cell: ({ row }) => (
      <Badge
        variant="secondary"
        className={cn(
          "text-xs font-semibold whitespace-nowrap hover:bg-opacity-100",
          row.original.catering_required
            ? "bg-success/10 text-success hover:bg-success/10"
            : "bg-neutral text-text-light hover:bg-neutral"
        )}
      >
        {row.original.catering_required ? "Yes" : "No"}
      </Badge>
    ),
    enableColumnFilter: false,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <StatusChip status={row.original.status} />
        {row.original.conflicts.length > 0 && (
          <Badge
            variant="destructive"
            className="flex items-center gap-1.5 px-3 py-1"
            title={`${row.original.conflicts.length} conflict${
              row.original.conflicts.length === 1 ? "" : "s"
            }`}
          >
            <AlertTriangle className="size-3.5" />
            <span className="text-xs font-semibold">Conflicts</span>
          </Badge>
        )}
      </div>
    ),
    filterFn: (row, columnId, filterValue) => {
      const statuses = filterValue as BookingStatus[] | undefined;
      if (!statuses?.length) return true;
      return statuses.includes(row.getValue(columnId) as BookingStatus);
    },
  },
];

export default function AdminBookingsClient({
  bookings,
}: {
  bookings: BookingWithMeta[];
}) {
  const statusCounts = useMemo(() => {
    return bookings.reduce<Record<BookingStatus, number>>(
      (acc, booking) => {
        acc[booking.status] = (acc[booking.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<BookingStatus, number>
    );
  }, [bookings]);

  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const toolbarBadges = [
    { label: "Pending", status: "Pending" as BookingStatus },
    { label: "Approved", status: "Approved" as BookingStatus },
  ];

  return (
    <Card>
      {isLoading && <LoadingOverlay />}
      <CardHeader>
        <CardTitle className="text-lg text-text">Bookings list</CardTitle>
        <CardDescription className="text-sm text-text-light">
          Review new requests and progress them through triage
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={bookings}
          emptyMessage={<TableEmptyState />}
          zebra
          onRowClick={(row) => {
            setIsLoading(true);
            router.push(`/admin/bookings/${row.id}`);
          }}
          renderToolbar={(table) => {
            const searchValue =
              (table.getColumn("customer_name")?.getFilterValue() as string) ??
              "";
            const statusFilter =
              (table.getColumn("status")?.getFilterValue() as
                | BookingStatus[]
                | undefined) ?? [];

            const toggleStatus = (status: BookingStatus, enabled: boolean) => {
              const column = table.getColumn("status");
              if (!column) return;
              const current = new Set(
                (column.getFilterValue() as BookingStatus[] | undefined) ?? []
              );
              if (enabled) {
                current.add(status);
              } else {
                current.delete(status);
              }
              const next = Array.from(current);
              column.setFilterValue(next.length ? next : undefined);
            };

            return (
              <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-neutral/60 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  {statusOptions.map(({ label, value }) => {
                    const isActive = statusFilter.includes(value);
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => toggleStatus(value, !isActive)}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold transition-all duration-200",
                          isActive
                            ? "border-primary bg-primary text-white shadow-sm"
                            : "border-border/60 bg-white text-text-light hover:border-primary/40 hover:text-text"
                        )}
                      >
                        <span>{label}</span>
                        <span className="rounded-full bg-neutral px-2 py-0.5 text-[11px] font-semibold text-text">
                          {statusCounts[value] ?? 0}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-full max-w-xs">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-light/70"
                      aria-hidden="true"
                    />
                    <Input
                      value={searchValue}
                      onChange={(event) =>
                        table
                          .getColumn("customer_name")
                          ?.setFilterValue(event.target.value)
                      }
                      placeholder="Search by group or reference"
                      className="rounded-full border-border/70 bg-white pl-9"
                    />
                  </div>
                </div>
              </div>
            );
          }}
        />
      </CardContent>
    </Card>
  );
}

function TableEmptyState() {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-dashed border-border/70 bg-neutral/60 px-8 py-10 text-center">
      <Sparkles className="size-12 text-text-light" aria-hidden />
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-text">
          No bookings match your filters
        </h3>
        <p className="text-sm text-text-light text-balance">
          Try adjusting your search or filters to find what you're looking for.
        </p>
      </div>
    </div>
  );
}
