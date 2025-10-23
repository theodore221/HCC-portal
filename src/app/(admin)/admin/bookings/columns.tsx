import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { StatusChip } from "@/components/ui/status-chip"
import { BookingSummary } from "@/lib/mock-data"
import { formatDateRange } from "@/lib/utils"

export const bookingsColumns: ColumnDef<BookingSummary>[] = [
  {
    accessorKey: "reference",
    header: "Ref",
    cell: ({ row }) => (
      <span className="font-semibold text-olive-900">{row.original.reference}</span>
    ),
  },
  {
    accessorKey: "groupName",
    header: "Group",
  },
  {
    accessorKey: "arrival",
    header: "Dates",
    cell: ({ row }) => (
      <span>
        {formatDateRange(row.original.arrival, row.original.departure)}
      </span>
    ),
  },
  {
    accessorKey: "headcount",
    header: "Headcount",
  },
  {
    id: "spaces",
    header: "Spaces",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.spaces.map((space) => (
          <Badge key={space} variant="outline">
            {space}
          </Badge>
        ))}
      </div>
    ),
    enableSorting: false,
    meta: {
      cellClassName: "max-w-[220px]",
    },
  },
  {
    accessorKey: "cateringRequired",
    header: "Catering",
    cell: ({ row }) => (row.original.cateringRequired ? "Yes" : "No"),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusChip status={row.original.status} />,
    enableSorting: false,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm">
          Triage
        </Button>
        <Button variant="outline" size="sm">
          Approve
        </Button>
        <Link
          href={`/admin/bookings/${row.original.id}`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          Open
        </Link>
      </div>
    ),
    enableSorting: false,
    meta: {
      cellClassName: "min-w-[200px]",
    },
  },
]
