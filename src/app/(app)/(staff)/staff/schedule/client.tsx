"use client";

import { useMemo, useState } from "react";
import { CalendarDays, LayoutGrid, Search, Table2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ScheduleRow } from "@/lib/queries/schedule.server";

import { ScheduleCards } from "./schedule-card";
import { ScheduleTable } from "./schedule-table";

interface ScheduleClientProps {
  data: ScheduleRow[];
}

export default function ScheduleClient({ data }: ScheduleClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase();
    return data.filter((row) => {
      // Search across multiple fields
      return (
        row.groupName.toLowerCase().includes(query) ||
        row.contactPerson?.toLowerCase().includes(query) ||
        row.spaces.some((space) => space.toLowerCase().includes(query)) ||
        row.arrivalDate.includes(query)
      );
    });
  }, [data, searchQuery]);

  // Stats for the header
  const stats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const upcoming = data.filter((row) => row.arrivalDate >= today);
    const overnightCount = data.filter((row) => row.overnightStay).length;
    const cateredCount = data.filter(
      (row) => row.catering === "Yes" || row.catering === "Breakfast"
    ).length;

    return {
      total: data.length,
      upcoming: upcoming.length,
      overnight: overnightCount,
      catered: cateredCount,
    };
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="size-5 text-primary" />
                Schedule
              </CardTitle>
              <CardDescription>
                At-a-glance view of all incoming groups and bookings
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="rounded-lg bg-primary/10 px-3 py-1.5">
                <span className="font-semibold text-primary">{stats.total}</span>
                <span className="ml-1 text-gray-600">total</span>
              </div>
              <div className="rounded-lg bg-olive-100 px-3 py-1.5">
                <span className="font-semibold text-olive-800">
                  {stats.upcoming}
                </span>
                <span className="ml-1 text-gray-600">upcoming</span>
              </div>
              <div className="rounded-lg bg-amber-100 px-3 py-1.5">
                <span className="font-semibold text-amber-800">
                  {stats.overnight}
                </span>
                <span className="ml-1 text-gray-600">overnight</span>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Toolbar */}
        <CardContent className="border-t pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search groups, contacts, spaces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">View:</span>
              <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className={`gap-1.5 rounded-md px-3 py-1.5 text-xs ${
                    viewMode === "table"
                      ? "bg-white text-primary shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Table2 className="size-3.5" />
                  <span className="hidden sm:inline">Table</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("cards")}
                  className={`gap-1.5 rounded-md px-3 py-1.5 text-xs ${
                    viewMode === "cards"
                      ? "bg-white text-primary shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <LayoutGrid className="size-3.5" />
                  <span className="hidden sm:inline">Cards</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <div>
        {/* Show filtered count if searching */}
        {searchQuery && (
          <p className="mb-3 text-sm text-gray-500">
            Showing {filteredData.length} of {data.length} bookings
          </p>
        )}

        {viewMode === "table" ? (
          <ScheduleTable data={filteredData} />
        ) : (
          <ScheduleCards data={filteredData} />
        )}
      </div>
    </div>
  );
}
