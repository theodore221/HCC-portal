"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Coffee } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MOCK_BOOKINGS,
  MOCK_MEAL_JOBS,
  type BookingSummary,
  type MealJob,
} from "@/lib/mock-data";

interface ScheduleRow {
  id: string;
  groupName: string;
  spaces: string[];
  meals: MealJob[];
  coffeeCount: number;
}

interface WeekScheduleCardProps {
  title?: string;
  subtitle?: string;
  bookings?: BookingSummary[];
  mealJobs?: MealJob[];
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
});

function getMealLabel(meal: MealJob) {
  const mealDate = new Date(meal.date);
  const formattedDate = Number.isNaN(mealDate.getTime())
    ? meal.date
    : dateFormatter.format(mealDate);

  return `${formattedDate} · ${meal.timeSlot}`;
}

export function WeekScheduleCard({
  title = "Week schedule",
  subtitle = "Spaces and meals across groups",
  bookings = MOCK_BOOKINGS,
  mealJobs = MOCK_MEAL_JOBS,
}: WeekScheduleCardProps) {
  const scheduleData = React.useMemo<ScheduleRow[]>(() => {
    return bookings.map((booking) => {
      const mealsForBooking = mealJobs
        .filter((job) => job.bookingId === booking.id)
        .sort((a, b) => (a.date + a.timeSlot).localeCompare(b.date + b.timeSlot));

      const coffeeCount = mealsForBooking.filter((job) => job.percolatedCoffee).length;

      return {
        id: booking.id,
        groupName: booking.groupName,
        spaces: booking.spaces,
        meals: mealsForBooking,
        coffeeCount,
      };
    });
  }, [bookings, mealJobs]);

  const columns = React.useMemo<ColumnDef<ScheduleRow>[]>(
    () => [
      {
        accessorKey: "groupName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Group" />
        ),
        cell: ({ row }) => (
          <div className="font-medium text-olive-900">{row.original.groupName}</div>
        ),
        meta: "min-w-[160px]",
      },
      {
        accessorKey: "spaces",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Spaces" />
        ),
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.spaces.map((space) => (
              <Badge
                key={`${row.original.id}-${space}`}
                variant="outline"
                className="border-olive-200 bg-olive-50 text-olive-700"
              >
                {space}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        id: "meals",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Meals" />
        ),
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            {row.original.meals.map((meal) => (
              <Tooltip key={meal.id}>
                <TooltipTrigger asChild>
                  <Badge className="bg-olive-100 text-olive-800">
                    {getMealLabel(meal)}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <p className="font-semibold text-olive-900">{meal.timeSlot}</p>
                    <p className="text-olive-700">{meal.date}</p>
                    <p className="text-olive-600">Menu: {meal.menu.join(", ")}</p>
                    <p className="text-olive-600">
                      Coffee service: {meal.percolatedCoffee ? "Yes" : "No"}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
            {row.original.meals.length === 0 && (
              <span className="text-xs text-olive-500">No meals scheduled</span>
            )}
          </div>
        ),
      },
      {
        id: "coffee",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Coffee" />
        ),
        cell: ({ row }) => {
          const hasCoffee = row.original.coffeeCount > 0;

          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-2">
                  <Checkbox
                    checked={hasCoffee}
                    readOnly
                    aria-label={hasCoffee ? "Coffee scheduled" : "No coffee scheduled"}
                  />
                  <span className="flex items-center gap-1 text-xs text-olive-600">
                    <Coffee className="size-3" aria-hidden />
                    {row.original.coffeeCount}
                  </span>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {hasCoffee
                  ? `${row.original.coffeeCount} meal${row.original.coffeeCount === 1 ? "" : "s"} with percolated coffee`
                  : "No percolated coffee scheduled"}
              </TooltipContent>
            </Tooltip>
          );
        },
        meta: "w-[120px]",
      },
    ],
    [],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <TooltipProvider>
          <DataTable
            columns={columns}
            data={scheduleData}
            emptyMessage="No bookings scheduled for this period."
          />
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
