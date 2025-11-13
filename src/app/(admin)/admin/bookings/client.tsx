"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Filter, Loader2, MoreHorizontal, Search } from "lucide-react";

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
import {
  getBookingDisplayName,
  type BookingStatus,
  type BookingWithMeta,
} from "@/lib/queries/bookings";
import { cn } from "@/lib/utils";

interface ActionColumnOptions {
  onApprove: (booking: BookingWithMeta) => void;
  approvingBookingId: string | null;
}

function createColumns({
  onApprove,
  approvingBookingId,
}: ActionColumnOptions): ColumnDef<BookingWithMeta>[] {
  return [
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
      accessorKey: "customer_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Group" />
      ),
      cell: ({ row }) => (
        <div className="flex flex-col gap-1 text-sm text-olive-900">
          <span className="font-medium">{getBookingDisplayName(row.original)}</span>
          <span className="text-xs text-olive-500">
            {row.original.headcount} guests · {row.original.is_overnight ? "Overnight" : "Day use"}
          </span>
        </div>
      ),
      filterFn: (row, _columnId, filterValue) => {
        if (!filterValue) return true;
        const value = (filterValue as string).toLowerCase();
        const booking = row.original;
        const displayName = getBookingDisplayName(booking).toLowerCase();
        const reference = booking.reference?.toLowerCase() ?? "";
        return displayName.includes(value) || reference.includes(value);
      },
    },
    {
      accessorKey: "arrival_date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Dates" />
      ),
      cell: ({ row }) => (
        <div className="flex flex-col text-sm text-olive-900">
          <span>{formatDateRangeLabel(row.original.arrival_date, row.original.departure_date)}</span>
          <span className="text-xs text-olive-500">{row.original.is_overnight ? "Includes accommodation" : "Day booking"}</span>
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
              key={`${row.original.id}-${space}`}
              variant="outline"
              className="border-olive-200 bg-white text-xs font-medium text-olive-700"
            >
              {space}
            </Badge>
          ))}
          {row.original.spaces.length === 0 && (
            <span className="text-xs text-olive-500">None</span>
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
          variant="outline"
          className={cn(
            "border-olive-200 text-xs font-semibold",
            row.original.catering_required
              ? "bg-emerald-100 text-emerald-700"
              : "bg-olive-50 text-olive-600",
          )}
        >
          {row.original.catering_required ? "Required" : "Self managed"}
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
        const isApproving = approvingBookingId === booking.id;
        const canApprove = ["Pending", "InTriage"].includes(booking.status);

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
                <DropdownMenuItem disabled>Move to triage</DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!canApprove || isApproving}
                  onSelect={(event) => {
                    event.preventDefault();
                    if (!canApprove || isApproving) return;
                    onApprove(booking);
                  }}
                >
                  {isApproving ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      Approving…
                    </span>
                  ) : (
                    "Mark approved"
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" disabled={isApproving}>
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
}

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


export default function AdminBookingsClient({
  bookings,
}: {
  bookings: BookingWithMeta[];
}) {
  const router = useRouter();
  const [approvingBookingId, setApprovingBookingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const statusCounts = useMemo(() => {
    return bookings.reduce<Record<BookingStatus, number>>((acc, booking) => {
      acc[booking.status] = (acc[booking.status] ?? 0) + 1;
      return acc;
    }, {} as Record<BookingStatus, number>);
  }, [bookings]);

  const handleApprove = useCallback(
    async (booking: BookingWithMeta) => {
      setActionError(null);
      setApprovingBookingId(booking.id);

      try {
        const response = await fetch(`/api/admin/bookings/${booking.id}/approve`, {
          method: "POST",
        });

        if (!response.ok) {
          let message = "Unable to approve the booking. Please try again.";
          try {
            const data = (await response.json()) as { error?: string };
            if (data?.error) {
              message = data.error;
            }
          } catch {
            // ignore JSON parse failures and fall back to the default message
          }
          throw new Error(message);
        }

        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to approve the booking.";
        setActionError(message);
      } finally {
        setApprovingBookingId(null);
      }
    },
    [router]
  );

  const columns = useMemo(
    () => createColumns({ onApprove: handleApprove, approvingBookingId }),
    [handleApprove, approvingBookingId]
  );

  const toolbarBadges = [
    { label: "Pending", status: "Pending" as BookingStatus },
    { label: "In triage", status: "InTriage" as BookingStatus },
    { label: "Approved", status: "Approved" as BookingStatus },
  ];

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
          {actionError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50/80 p-3 text-sm text-red-700">
              {actionError}
            </div>
          )}
          <DataTable
            columns={columns}
            data={bookings}
            renderToolbar={(table) => {
              const searchValue = (table.getColumn("customer_name")?.getFilterValue() as string) ?? "";
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
                          table.getColumn("customer_name")?.setFilterValue(event.target.value)
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
        issues={bookings.flatMap((booking) => booking.conflicts).slice(0, 2)}
      />
    </div>
  );
}
