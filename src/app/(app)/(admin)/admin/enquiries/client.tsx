"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Search, Users, Sparkles, MessageCircle, DollarSign, ArrowRightCircle, XCircle, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { Input } from "@/components/ui/input";
import { EnquiryStatusChip } from "@/components/ui/enquiry-status-chip";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import type { Enquiry, EnquiryStatus } from "@/lib/queries/enquiries";
import { cn } from "@/lib/utils";

interface StatusCounts {
  total: number;
  new: number;
  in_discussion: number;
  quoted: number;
  converted_to_booking: number;
  lost: number;
  conversionRate: number;
}

interface EnquiriesClientProps {
  enquiries: Enquiry[];
  statusCounts: StatusCounts;
  initialFilters: {
    status?: EnquiryStatus;
    search?: string;
  };
}

// Format date for display
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

// Format date range for event
function formatEventDates(startDate: string | null, endDate: string | null): string {
  if (!startDate) return "TBD";

  const formatter = new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
  });

  const start = formatter.format(new Date(startDate));
  if (!endDate || startDate === endDate) return start;

  const end = formatter.format(new Date(endDate));
  return `${start} → ${end}`;
}

const columns: ColumnDef<Enquiry>[] = [
  {
    accessorKey: "reference_number",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Reference" />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-sm font-medium text-olive-900">
        {row.original.reference_number}
      </span>
    ),
  },
  {
    accessorKey: "customer_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customer" />
    ),
    cell: ({ row }) => (
      <div className="flex flex-col text-sm">
        <span className="font-medium text-olive-900">{row.original.customer_name}</span>
        <span className="text-xs text-olive-600">{row.original.customer_email}</span>
        {row.original.organization && (
          <span className="text-xs text-olive-500">{row.original.organization}</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "event_type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Event Type" />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-olive-800">{row.original.event_type}</span>
    ),
    meta: "hidden md:table-cell",
  },
  {
    id: "dates",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Event Dates" />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-olive-800">
        {formatEventDates(row.original.approximate_start_date, row.original.approximate_end_date)}
      </span>
    ),
    meta: "hidden lg:table-cell",
  },
  {
    accessorKey: "estimated_guests",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Guests" className="justify-center" />
    ),
    cell: ({ row }) => (
      <div className="text-center text-sm font-semibold text-olive-900">
        {row.original.estimated_guests || "—"}
      </div>
    ),
    meta: "hidden sm:table-cell text-center",
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => <EnquiryStatusChip status={row.original.status} />,
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-olive-600">{formatDate(row.original.created_at)}</span>
    ),
    meta: "hidden xl:table-cell",
  },
];

export function EnquiriesClient({
  enquiries,
  statusCounts,
  initialFilters,
}: EnquiriesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [searchValue, setSearchValue] = useState(initialFilters.search || "");

  // Handle status filter change
  const handleStatusFilter = useCallback((status?: EnquiryStatus) => {
    const params = new URLSearchParams(searchParams);

    if (status) {
      params.set("status", status);
    } else {
      params.delete("status");
    }

    router.push(`/admin/enquiries?${params.toString()}`);
  }, [router, searchParams]);

  // Handle search
  const handleSearch = useCallback((value: string) => {
    setSearchValue(value);

    const params = new URLSearchParams(searchParams);

    if (value.trim()) {
      params.set("search", value.trim());
    } else {
      params.delete("search");
    }

    router.push(`/admin/enquiries?${params.toString()}`);
  }, [router, searchParams]);

  // Handle row click
  const handleRowClick = useCallback((enquiry: Enquiry) => {
    setIsNavigating(true);
    router.push(`/admin/enquiries/${enquiry.id}`);
  }, [router]);

  const activeStatus = initialFilters.status;

  return (
    <div className="space-y-6 p-6">
      {isNavigating && <LoadingOverlay />}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-olive-900">Enquiries</h1>
        <p className="mt-2 text-sm text-olive-600">
          Manage customer enquiries and track conversion pipeline
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-olive-600">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-olive-500" />
              <span className="text-2xl font-bold text-olive-900">{statusCounts.total}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-status-slate/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-status-slate">New</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-status-slate" />
              <span className="text-2xl font-bold text-status-slate">{statusCounts.new}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-status-ochre/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-status-ochre">In Discussion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-status-ochre" />
              <span className="text-2xl font-bold text-status-ochre">{statusCounts.in_discussion}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-status-forest/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-status-forest">Quoted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-status-forest" />
              <span className="text-2xl font-bold text-status-forest">{statusCounts.quoted}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-status-plum/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-status-plum">Converted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ArrowRightCircle className="h-4 w-4 text-status-plum" />
              <span className="text-2xl font-bold text-status-plum">{statusCounts.converted_to_booking}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-status-stone/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-status-stone">Lost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-status-stone" />
              <span className="text-2xl font-bold text-status-stone">{statusCounts.lost}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-olive-50 to-olive-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-olive-700">Conv. Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-olive-600" />
              <span className="text-2xl font-bold text-olive-900">{statusCounts.conversionRate}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Filter Pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleStatusFilter()}
          className={cn(
            "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
            !activeStatus
              ? "border-gray-300 bg-gray-100 text-gray-900"
              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
          )}
        >
          All ({statusCounts.total})
        </button>
        <button
          onClick={() => handleStatusFilter("new")}
          className={cn(
            "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
            activeStatus === "new"
              ? "border-status-slate/30 bg-status-slate/10 text-status-slate"
              : "border-status-slate/20 bg-white text-status-slate hover:bg-status-slate/5"
          )}
        >
          New ({statusCounts.new})
        </button>
        <button
          onClick={() => handleStatusFilter("in_discussion")}
          className={cn(
            "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
            activeStatus === "in_discussion"
              ? "border-status-ochre/30 bg-status-ochre/10 text-status-ochre"
              : "border-status-ochre/20 bg-white text-status-ochre hover:bg-status-ochre/5"
          )}
        >
          In Discussion ({statusCounts.in_discussion})
        </button>
        <button
          onClick={() => handleStatusFilter("quoted")}
          className={cn(
            "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
            activeStatus === "quoted"
              ? "border-status-forest/30 bg-status-forest/10 text-status-forest"
              : "border-status-forest/20 bg-white text-status-forest hover:bg-status-forest/5"
          )}
        >
          Quoted ({statusCounts.quoted})
        </button>
        <button
          onClick={() => handleStatusFilter("converted_to_booking")}
          className={cn(
            "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
            activeStatus === "converted_to_booking"
              ? "border-status-plum/30 bg-status-plum/10 text-status-plum"
              : "border-status-plum/20 bg-white text-status-plum hover:bg-status-plum/5"
          )}
        >
          Converted ({statusCounts.converted_to_booking})
        </button>
        <button
          onClick={() => handleStatusFilter("lost")}
          className={cn(
            "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
            activeStatus === "lost"
              ? "border-status-stone/30 bg-status-stone/10 text-status-stone"
              : "border-status-stone/20 bg-white text-status-stone hover:bg-status-stone/5"
          )}
        >
          Lost ({statusCounts.lost})
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-olive-400" />
        <Input
          placeholder="Search by name, email, reference, or organization..."
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={enquiries}
            onRowClick={handleRowClick}
          />
        </CardContent>
      </Card>
    </div>
  );
}
