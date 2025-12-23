"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import type { ScheduleRow } from "@/lib/queries/schedule.server";
import { cn } from "@/lib/utils";

// Yes/No badge component
function YesNoBadge({ value }: { value: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] font-semibold",
        value
          ? "border-olive-200 bg-olive-100 text-olive-800"
          : "border-gray-200 bg-gray-100 text-gray-500"
      )}
    >
      {value ? "Yes" : "No"}
    </Badge>
  );
}

// Space pill component
function SpacePill({ name }: { name: string }) {
  return (
    <Badge
      variant="outline"
      className="whitespace-nowrap border-primary/20 bg-primary/10 text-[10px] font-medium text-primary"
    >
      {name}
    </Badge>
  );
}

// Format date as "DD-MMM-YY"
function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

interface ScheduleTableProps {
  data: ScheduleRow[];
}

export function ScheduleTable({ data }: ScheduleTableProps) {
  const columns = useMemo<ColumnDef<ScheduleRow>[]>(
    () => [
      // Date column with day of week
      {
        id: "date",
        accessorKey: "arrivalDate",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Date" />
        ),
        cell: ({ row }) => (
          <Link
            href={`/admin/bookings/${row.original.id}`}
            className="flex items-center gap-2 text-sm hover:underline"
          >
            <span className="w-4 font-bold text-primary">
              {row.original.dayOfWeek}
            </span>
            <span className="whitespace-nowrap font-medium text-text">
              {formatDate(row.original.arrivalDate)}
            </span>
          </Link>
        ),
        sortingFn: "datetime",
        meta: "min-w-[120px]",
      },
      // Group Name
      {
        accessorKey: "groupName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Group Name" />
        ),
        cell: ({ row }) => (
          <Link
            href={`/admin/bookings/${row.original.id}`}
            className="font-medium text-text hover:text-primary hover:underline"
          >
            {row.original.groupName}
          </Link>
        ),
        meta: "min-w-[180px]",
      },
      // Spaces Required
      {
        accessorKey: "spaces",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Spaces Required" />
        ),
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.spaces.length > 0 ? (
              row.original.spaces.map((space) => (
                <SpacePill key={space} name={space} />
              ))
            ) : (
              <span className="text-xs text-gray-400">-</span>
            )}
          </div>
        ),
        meta: "min-w-[200px]",
      },
      // Chapel Use
      {
        accessorKey: "chapelUse",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Chapel" />
        ),
        cell: ({ row }) => <YesNoBadge value={row.original.chapelUse} />,
        meta: "w-[70px]",
      },
      // Minors
      {
        accessorKey: "minors",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Minors" />
        ),
        cell: ({ row }) => <YesNoBadge value={row.original.minors} />,
        meta: "w-[70px]",
      },
      // Guests
      {
        accessorKey: "guests",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Guests" />
        ),
        cell: ({ row }) => (
          <span className="font-medium text-text">{row.original.guests}</span>
        ),
        meta: "w-[70px] text-center",
      },
      // Catering
      {
        accessorKey: "catering",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Catering" />
        ),
        cell: ({ row }) => {
          const value = row.original.catering;
          const styles = {
            Yes: "border-olive-200 bg-olive-100 text-olive-800",
            Self: "border-gray-200 bg-gray-100 text-gray-600",
            Breakfast: "border-amber-200 bg-amber-100 text-amber-800",
          };
          return (
            <Badge
              variant="outline"
              className={cn("text-[10px] font-semibold", styles[value])}
            >
              {value}
            </Badge>
          );
        },
        meta: "w-[80px]",
      },
      // O/N Stay
      {
        accessorKey: "overnightStay",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="O/N Stay" />
        ),
        cell: ({ row }) => <YesNoBadge value={row.original.overnightStay} />,
        meta: "w-[70px]",
      },
      // Lawn
      {
        accessorKey: "lawn",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Lawn" />
        ),
        cell: ({ row }) => <YesNoBadge value={row.original.lawn} />,
        meta: "w-[60px]",
      },
      // Arrival Time
      {
        accessorKey: "arrivalTime",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Arrival" />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-text">
            {row.original.arrivalTime || "-"}
          </span>
        ),
        meta: "w-[70px]",
      },
      // Departure Time
      {
        accessorKey: "departureTime",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Departure" />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-text">
            {row.original.departureTime || "-"}
          </span>
        ),
        meta: "w-[80px]",
      },
      // Contact Person
      {
        accessorKey: "contactPerson",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Contact" />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-text">
            {row.original.contactPerson || "-"}
          </span>
        ),
        meta: "min-w-[120px]",
      },
      // Catering Type
      {
        accessorKey: "cateringType",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Catering Type" />
        ),
        cell: ({ row }) => {
          const value = row.original.cateringType;
          return (
            <Badge
              variant="outline"
              className={cn(
                "whitespace-nowrap text-[10px] font-semibold",
                value === "Catered"
                  ? "border-olive-200 bg-olive-100 text-olive-800"
                  : "border-gray-200 bg-gray-100 text-gray-600"
              )}
            >
              {value}
            </Badge>
          );
        },
        meta: "w-[100px]",
      },
      // Dietaries
      {
        accessorKey: "hasDietaries",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Dietaries" />
        ),
        cell: ({ row }) => <YesNoBadge value={row.original.hasDietaries} />,
        meta: "w-[80px]",
      },
      // Meal Times
      {
        accessorKey: "mealTimes",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Meal Times" />
        ),
        cell: ({ row }) => {
          const value = row.original.mealTimes;
          return (
            <Badge
              variant="outline"
              className={cn(
                "whitespace-nowrap text-[10px] font-semibold",
                value === "Standard"
                  ? "border-gray-200 bg-gray-100 text-gray-600"
                  : "border-amber-200 bg-amber-100 text-amber-800"
              )}
            >
              {value}
            </Badge>
          );
        },
        meta: "w-[90px]",
      },
      // Percolated Coffee
      {
        accessorKey: "percolatedCoffee",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Perc. Coffee" />
        ),
        cell: ({ row }) => <YesNoBadge value={row.original.percolatedCoffee} />,
        meta: "w-[90px]",
      },
      // Bed Type
      {
        accessorKey: "bedType",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Bed Type" />
        ),
        cell: ({ row }) => {
          const value = row.original.bedType;
          if (!value) return <span className="text-xs text-gray-400">-</span>;
          return (
            <Badge
              variant="outline"
              className={cn(
                "whitespace-nowrap text-[10px] font-semibold",
                value === "BYO Linen"
                  ? "border-amber-200 bg-amber-100 text-amber-800"
                  : "border-olive-200 bg-olive-100 text-olive-800"
              )}
            >
              {value}
            </Badge>
          );
        },
        meta: "w-[100px]",
      },
      // Room List
      {
        accessorKey: "roomList",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Room List" />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-gray-400">
            {row.original.roomList || "-"}
          </span>
        ),
        meta: "w-[90px]",
      },
      // Notes
      {
        accessorKey: "notes",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Notes" />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-gray-400">
            {row.original.notes || "-"}
          </span>
        ),
        meta: "min-w-[150px]",
      },
    ],
    []
  );

  return (
    <div className="overflow-x-auto">
      <DataTable
        columns={columns}
        data={data}
        emptyMessage="No bookings scheduled."
        zebra
      />
    </div>
  );
}
