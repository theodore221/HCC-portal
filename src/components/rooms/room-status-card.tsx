"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, Sparkles, Wrench, Users, Loader2, ShirtIcon, ShowerHead, Bed, BookOpen } from "lucide-react";
import type { RoomWithStatus } from "@/lib/queries/rooms.server";

interface RoomStatusCardProps {
  room: RoomWithStatus;
  selectedDate: string;
  onMarkCleaned: (roomId: string, date: string, bookingId?: string) => Promise<void>;
  onMarkSetupComplete: (roomId: string, date: string, bookingId?: string) => Promise<void>;
}

const statusConfig = {
  ready: {
    label: "Ready",
    color: "bg-neutral-50 border-neutral-200 text-neutral-700",
    badgeVariant: "outline" as const,
    icon: CheckCircle2,
  },
  needs_setup: {
    label: "Needs Setup",
    color: "bg-blue-50 border-blue-200 text-blue-700",
    badgeVariant: "secondary" as const,
    icon: Wrench,
  },
  setup_complete: {
    label: "Setup Complete",
    color: "bg-green-50 border-green-200 text-green-700",
    badgeVariant: "default" as const,
    icon: CheckCircle2,
  },
  in_use: {
    label: "In Use",
    color: "bg-rose-50 border-rose-200 text-rose-700",
    badgeVariant: "outline" as const,
    icon: Users,
  },
  cleaning_required: {
    label: "Cleaning Required",
    color: "bg-amber-50 border-amber-200 text-amber-700",
    badgeVariant: "default" as const,
    icon: Sparkles,
  },
};

export function RoomStatusCard({
  room,
  selectedDate,
  onMarkCleaned,
  onMarkSetupComplete,
}: RoomStatusCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const config = statusConfig[room.status];
  const StatusIcon = config.icon;

  const handleAction = async () => {
    setIsLoading(true);
    try {
      if (room.status === "cleaning_required") {
        await onMarkCleaned(room.id, selectedDate, room.relatedBookingId || undefined);
      } else if (room.status === "needs_setup") {
        await onMarkSetupComplete(room.id, selectedDate, room.relatedBookingId || undefined);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const showActionButton = room.status === "cleaning_required" || room.status === "needs_setup";

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-lg border-2 p-4 transition-all",
        config.color,
        "min-h-[140px]"
      )}
    >
      {/* Room Number */}
      <div className="mb-2 flex items-start justify-between">
        <h3 className="text-2xl font-bold">{room.room_number || room.name}</h3>
        <Badge
          variant={config.badgeVariant}
          className={cn(
            "ml-2",
            room.status === "ready" && "bg-black text-white hover:bg-neutral-800",
            room.status === "needs_setup" && "bg-blue-600 text-white hover:bg-blue-700",
            room.status === "setup_complete" && "bg-green-600 text-white hover:bg-green-700",
            room.status === "in_use" && "bg-[#FA6666] text-white hover:bg-[#F85555]",
            room.status === "cleaning_required" && "bg-amber-600 text-white hover:bg-amber-700"
          )}
        >
          <StatusIcon className="mr-1 h-3 w-3" />
          {config.label}
        </Badge>
      </div>

      {/* Room Details */}
      <div className="mb-auto flex-1 space-y-1">
        {/* Guest Names (for in_use, needs_setup, or setup_complete) */}
        {(room.status === "in_use" || room.status === "needs_setup" || room.status === "setup_complete") && room.guestNames.length > 0 && (
          <div className="space-y-0.5">
            {room.guestNames.slice(0, room.occupantCount || 2).map((name, i) => {
              const trimmed = (name || "").trim();
              const isBlank = trimmed.length === 0;
              const displayName = isBlank ? `Guest ${i + 1}` : trimmed;
              return (
                <p
                  key={i}
                  className={cn(
                    "truncate text-sm",
                    isBlank ? "font-medium text-neutral-400" : "font-semibold"
                  )}
                >
                  {displayName}
                </p>
              );
            })}
          </div>
        )}

        {/* Booking Name (for cleaning_required) */}
        {room.status === "cleaning_required" && room.relatedBookingName && (
          <p className="truncate text-sm font-medium text-neutral-600">
            {room.relatedBookingName}
          </p>
        )}

        {/* Occupant Count (for needs_setup or setup_complete) */}
        {(room.status === "needs_setup" || room.status === "setup_complete") && room.occupantCount > 0 && (
          <p className="text-sm text-neutral-600">
            <Users className="mr-1 inline h-3 w-3" />
            {room.occupantCount} {room.occupantCount === 1 ? "guest" : "guests"}
          </p>
        )}

        {/* BYO Linen Indicator */}
        {room.byoLinen && (room.status === "needs_setup" || room.status === "setup_complete" || room.status === "in_use") && (
          <div className="flex items-center gap-1 text-xs text-neutral-600">
            <ShirtIcon className="h-3 w-3" />
            <span>BYO Linen</span>
          </div>
        )}

        {/* Extra Features */}
        {(room.status === "needs_setup" || room.status === "setup_complete" || room.status === "in_use") &&
         (room.extraBedSelected || room.ensuiteSelected || room.privateStudySelected) && (
          <div className="flex flex-wrap gap-2 pt-1">
            {room.extraBedSelected && (
              <div
                className={cn(
                  "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
                  room.status === "needs_setup" && "bg-blue-100 text-blue-700",
                  room.status === "setup_complete" && "bg-green-100 text-green-700",
                  room.status === "in_use" && "bg-rose-100 text-rose-700"
                )}
              >
                <Bed className="h-3 w-3" />
                <span>Extra Bed</span>
              </div>
            )}
            {room.ensuiteSelected && (
              <div
                className={cn(
                  "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
                  room.status === "needs_setup" && "bg-blue-100 text-blue-700",
                  room.status === "setup_complete" && "bg-green-100 text-green-700",
                  room.status === "in_use" && "bg-rose-100 text-rose-700"
                )}
              >
                <ShowerHead className="h-3 w-3" />
                <span>Ensuite</span>
              </div>
            )}
            {room.privateStudySelected && (
              <div
                className={cn(
                  "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
                  room.status === "needs_setup" && "bg-blue-100 text-blue-700",
                  room.status === "setup_complete" && "bg-green-100 text-green-700",
                  room.status === "in_use" && "bg-rose-100 text-rose-700"
                )}
              >
                <BookOpen className="h-3 w-3" />
                <span>Private Study</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Button */}
      {showActionButton && (
        <Button
          onClick={handleAction}
          disabled={isLoading}
          size="sm"
          className={cn(
            "mt-3 w-full",
            room.status === "needs_setup" &&
              "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
            room.status === "cleaning_required" &&
              "bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500"
          )}
          variant="secondary"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : room.status === "cleaning_required" ? (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Mark Cleaned
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark Setup Complete
            </>
          )}
        </Button>
      )}
    </div>
  );
}
