"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Users,
  UtensilsCrossed,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ScheduleRow } from "@/lib/queries/schedule.server";
import { cn } from "@/lib/utils";

// Format date as "DD-MMM-YY"
function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
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

// Yes/No indicator
function YesNoIndicator({
  label,
  value,
}: {
  label: string;
  value: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-600">{label}</span>
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
    </div>
  );
}

interface ScheduleCardProps {
  item: ScheduleRow;
}

function ScheduleCard({ item }: ScheduleCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="overflow-hidden">
      <Link href={`/admin/bookings/${item.id}`}>
        <CardContent className="p-4">
          {/* Header: Day, Date, Group Name */}
          <div className="mb-3 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-primary">
                  {item.dayOfWeek}
                </span>
                <span className="text-sm font-medium text-gray-600">
                  {formatDate(item.arrivalDate)}
                </span>
              </div>
              <h3 className="mt-1 text-base font-semibold text-text">
                {item.groupName}
              </h3>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-semibold",
                item.overnightStay
                  ? "border-primary/20 bg-primary/10 text-primary"
                  : "border-gray-200 bg-gray-100 text-gray-600"
              )}
            >
              {item.overnightStay ? "Overnight" : "Day Visit"}
            </Badge>
          </div>

          {/* Spaces */}
          {item.spaces.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1">
              {item.spaces.map((space) => (
                <SpacePill key={space} name={space} />
              ))}
            </div>
          )}

          {/* Quick Info Grid */}
          <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-gray-700">
              <Users className="size-3.5 text-gray-500" />
              <span className="font-medium">{item.guests}</span>
              <span className="text-gray-500">guests</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-700">
              <UtensilsCrossed className="size-3.5 text-gray-500" />
              <Badge
                variant="outline"
                className={cn(
                  "text-[9px] font-semibold",
                  item.catering === "Yes"
                    ? "border-olive-200 bg-olive-100 text-olive-800"
                    : item.catering === "Breakfast"
                      ? "border-amber-200 bg-amber-100 text-amber-800"
                      : "border-gray-200 bg-gray-100 text-gray-600"
                )}
              >
                {item.catering}
              </Badge>
            </div>
            {(item.arrivalTime || item.departureTime) && (
              <div className="col-span-2 flex items-center gap-1.5 text-gray-700">
                <Clock className="size-3.5 text-gray-500" />
                <span>
                  {item.arrivalTime || "TBC"} - {item.departureTime || "TBC"}
                </span>
              </div>
            )}
          </div>

          {/* Contact */}
          {item.contactPerson && (
            <div className="mb-3 text-xs text-gray-600">
              <span className="font-medium">Contact:</span> {item.contactPerson}
            </div>
          )}
        </CardContent>
      </Link>

      {/* Expandable Details */}
      <div
        className="border-t border-gray-100 bg-gray-50 px-4 py-2"
        onClick={(e) => {
          e.preventDefault();
          setExpanded(!expanded);
        }}
      >
        <button
          type="button"
          className="flex w-full items-center justify-between text-xs text-gray-600"
        >
          <span>{expanded ? "Less details" : "More details"}</span>
          {expanded ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </button>
      </div>

      {expanded && (
        <div className="space-y-2 border-t border-gray-100 bg-gray-50 p-4">
          <YesNoIndicator label="Dietaries" value={item.hasDietaries} />
          <YesNoIndicator
            label="Percolated Coffee"
            value={item.percolatedCoffee}
          />

          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Catering Type</span>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-semibold",
                item.cateringType === "Catered"
                  ? "border-olive-200 bg-olive-100 text-olive-800"
                  : "border-gray-200 bg-gray-100 text-gray-600"
              )}
            >
              {item.cateringType}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Meal Times</span>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-semibold",
                item.mealTimes === "Standard"
                  ? "border-gray-200 bg-gray-100 text-gray-600"
                  : "border-amber-200 bg-amber-100 text-amber-800"
              )}
            >
              {item.mealTimes}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Bed Type</span>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-semibold",
                item.bedType === "BYO Linen"
                  ? "border-amber-200 bg-amber-100 text-amber-800"
                  : item.bedType === "Fully Provided"
                    ? "border-olive-200 bg-olive-100 text-olive-800"
                    : "border-gray-200 bg-gray-100 text-gray-600"
              )}
            >
              {item.bedType ?? "TBC"}
            </Badge>
          </div>

          <div className="text-xs">
            <span className="text-gray-600">Notes</span>
            <p
              className={cn(
                "mt-1 whitespace-pre-wrap",
                item.notes ? "text-gray-700" : "text-gray-400"
              )}
            >
              {item.notes || "No notes"}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

interface ScheduleCardsProps {
  data: ScheduleRow[];
}

export function ScheduleCards({ data }: ScheduleCardsProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-gray-500">
        No bookings scheduled.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <ScheduleCard key={item.id} item={item} />
      ))}
    </div>
  );
}
