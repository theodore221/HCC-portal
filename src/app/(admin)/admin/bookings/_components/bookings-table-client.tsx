"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Filter, MoreHorizontal, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConflictBanner } from "@/components/ui/conflict-banner";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { StatusChip } from "@/components/ui/status-chip";
import type { BookingStatus } from "@/lib/queries/bookings";
import type { BookingSummary } from "@/lib/models";
import { cn } from "@/lib/utils";

const statusOptions: { label: string; value: BookingStatus }[] = [
  { label: "Pending", value: "Pending" },
  { label: "In triage", value: "InTriage" },
  { label: "Approved", value: "Approved" },
  { label: "Deposit pending", value: "DepositPending" },
  { label: "Deposit received", value: "DepositReceived" },
  { label: "In progress", value: "InProgress" },
  { label: "Completed", value: "Completed" },
  { label: "Cancelled", value: "Cancelled" },
];

const statusBadgeStyles: Partial<Record<BookingStatus, string>> = {
  Pending: "border-amber-200 bg-amber-100 text-amber-700",
  InTriage: "border-sky-200 bg-sky-100 text-sky-700",
  Approved: "border-emerald-200 bg-emerald-100 text-emerald-700",
  DepositPending: "border-amber-200 bg-amber-100 text-amber-700",
  DepositReceived: "border-emerald-200 bg-emerald-100 text-emerald-700",
  InProgress: "border-olive-200 bg-olive-100 text-olive-800",
  Completed: "border-olive-200 bg-olive-50 text-olive-700",
  Cancelled: "border-rose-200 bg-rose-100 text-rose-700",
};

function formatDateRange(arrival: string, departure: string) {
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

const columns: ColumnDef<BookingSummary>[] = [
  {
    accessorKey: "reference",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Reference" />
    ),
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        <span className="font-semibold text-olive-900">{row.original.reference ?? "—"}</span>
        <span className="text-xs uppercase tracking-wide text-olive-500">
          #{row.original.id}
        </span>
      </div>
    ),
    sortingFn: "alphanumeric",
  },
  {
    accessorKey: "groupName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Group" />
    ),
    cell: ({ row }) => (
      <div className="flex flex-col gap-1 text-sm text-olive-900">
        <span className="font-medium">{row.original.groupName}</span>
        <span className="text-xs text-olive-500">
          {row.original.headcount} guests · {row.original.overnight ? "Overnight" : "Day use"}
        </span>
      </div>
    ),
    filterFn: (row, _columnId, filterValue) => {
      if (!filterValue) return true;
      const value = (filterValue as string).toLowerCase();
      const booking = row.original;
      return (
        booking.groupName.toLowerCase().includes(value) ||
        (booking.reference ?? "").toLowerCase().includes(value)
      );
    },
  },
  {
    accessorKey: "arrival",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Dates" />
    ),
    cell: ({ row }) => (
      <div className="flex flex-col text-sm text-olive-900">
        <span>{formatDateRange(row.original.arrival, row.original.departure)}</span>
        <span className="text-xs text-olive-500">{row.original.overnight ? "Includes accommodation" : "Day booking"}</span>
      </div>
    ),
    sortingFn: "datetime",
  },
  {
    accessorKey: "headcount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Headcount" />
    ),
    cell: ({ row }) => (
      <div className="text-right text-sm font-semibold text-olive-900">
        {row.original.headcount}
      </div>
    ),
    enableColumnFilter: false,
    meta: "text-right",
  },
  {
    id: "spaces",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Spaces" />
    ),
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.spaces.map((space) => (
          <Badge
            key={space}
            variant="outline"
            className="border-olive-200 bg-white text-xs font-medium text-olive-700"
          >
            {space}
          </Badge>
        ))}
        {!row.original.spaces.length && (
          <span className="text-xs text-olive-500">TBC</span>
        )}
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "cateringRequired",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Catering" />
    ),
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={cn(
          "border-olive-200 text-xs font-semibold",
          row.original.cateringRequired
            ? "bg-emerald-100 text-emerald-700"
            : "bg-olive-50 text-olive-600",
        )}
      >
        {row.original.cateringRequired ? "Required" : "Self managed"}
      </Badge>
    ),
    enableColumnFilter: false,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => <StatusChip status={row.original.status} />,
    filterFn: (row, columnId, filterValue) => {
      const statuses = filterValue as BookingStatus[] | undefined;
      if (!statuses?.length) return true;
      return statuses.includes(row.getValue(columnId) as BookingStatus);
    },
  },
  {
    id: "actions",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Actions" />
    ),
    cell: ({ row }) => {
      const booking = row.original;

      return (
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/admin/bookings/${booking.id}`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-olive-700 hover:text-olive-900",
            )}
          >
            Open
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-olive-600 hover:bg-olive-100 hover:text-olive-900"
              >
                <MoreHorizontal className="size-4" aria-hidden="true" />
                <span className="sr-only">Open actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>{booking.reference ?? booking.id}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/admin/bookings/${booking.id}`}>View booking</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>Move to triage</DropdownMenuItem>
              <DropdownMenuItem>Mark approved</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                Cancel request
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    enableSorting: false,
    meta: "text-right",
  },
];

interface AdminBookingsClientProps {
  bookings: BookingSummary[];
}

export function AdminBookingsClient({ bookings }: AdminBookingsClientProps) {
  const statusCounts = useMemo(() => {
    return bookings.reduce<Record<BookingStatus, number>>((acc, booking) => {
      acc[booking.status] = (acc[booking.status] ?? 0) + 1;
      return acc;
    }, {} as Record<BookingStatus, number>);
  }, [bookings]);

  const toolbarBadges = useMemo(
    () => [
      { label: "Pending", status: "Pending" as BookingStatus },
      { label: "In triage", status: "InTriage" as BookingStatus },
      { label: "Approved", status: "Approved" as BookingStatus },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Bookings</CardTitle>
            <CardDescription>
              Filter by status, dates, catering or spaces
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3 text-sm text-olive-700">
          {toolbarBadges.map(({ label, status }) => (
            <Badge
              key={status}
              variant="outline"
              className={cn(
                "gap-2 border-olive-200 bg-olive-50 text-olive-700",
                statusBadgeStyles[status],
              )}
            >
              <span>{label}</span>
              <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-olive-700">
                {statusCounts[status] ?? 0}
              </span>
            </Badge>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Bookings list</CardTitle>
          <CardDescription>
            Review new requests and progress them through triage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={bookings}
            emptyMessage="No bookings found."
            renderToolbar={(table) => {
              const searchValue = (table.getColumn("groupName")?.getFilterValue() as string) ?? "";
              const statusFilter = (table.getColumn("status")?.getFilterValue() as BookingStatus[] | undefined) ?? [];

              const toggleStatus = (status: BookingStatus, enabled: boolean) => {
                const column = table.getColumn("status");
                if (!column) return;
                const current = new Set((column.getFilterValue() as BookingStatus[] | undefined) ?? []);
                if (enabled) {
                  current.add(status);
                } else {
                  current.delete(status);
                }
                const next = Array.from(current);
                column.setFilterValue(next.length ? next : undefined);
              };

              return (
                <div className="flex flex-col gap-4 rounded-2xl border border-olive-100 bg-olive-50/50 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {statusOptions.map(({ label, value }) => (
                      <Badge
                        key={value}
                        variant="outline"
                        className={cn(
                          "cursor-default gap-2 border-olive-200 bg-white text-olive-700",
                          statusBadgeStyles[value],
                          statusFilter.includes(value) && "border-olive-500 bg-olive-100 text-olive-900",
                        )}
                      >
                        <span>{label}</span>
                        <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-semibold text-olive-700">
                          {statusCounts[value] ?? 0}
                        </span>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative w-full max-w-xs">
                      <Search
                        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-olive-400"
                        aria-hidden="true"
                      />
                      <Input
                        value={searchValue}
                        onChange={(event) =>
                          table.getColumn("groupName")?.setFilterValue(event.target.value)
                        }
                        placeholder="Search by group or reference"
                        className="pl-9"
                      />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 border-olive-200 text-olive-700 hover:bg-olive-100"
                        >
                          <Filter className="size-4" aria-hidden="true" />
                          Filters
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-60">
                        <DropdownMenuLabel>Status filters</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {statusOptions.map(({ label, value }) => (
                          <DropdownMenuCheckboxItem
                            key={value}
                            checked={statusFilter.includes(value)}
                            onCheckedChange={(checked) => toggleStatus(value, checked)}
                            className="capitalize"
                          >
                            {label}
                            <DropdownMenuShortcut>{statusCounts[value] ?? 0}</DropdownMenuShortcut>
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-olive-200 text-olive-700 hover:bg-olive-100"
                    >
                      Export list
                    </Button>
                    <Button size="sm" className="bg-olive-700 text-white hover:bg-olive-800">
                      New booking
                    </Button>
                  </div>
                </div>
              );
            }}
          />
        </CardContent>
      </Card>
      <ConflictBanner
        issues={[
          "Corbett Room clash with Retreat 12 Nov",
          "Dining Hall capacity exceeded on 13 Nov",
        ]}
      />
    </div>
  );
}
