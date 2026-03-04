"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SpaceTimePickerProps {
  reservedDates: string[];
  startTime: string | null;
  endTime: string | null;
  isPending?: boolean;
  onSave: (startTime: string | null, endTime: string | null) => void;
}

export function SpaceTimePicker({
  reservedDates,
  startTime,
  endTime,
  isPending,
  onSave,
}: SpaceTimePickerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localStart, setLocalStart] = useState(startTime ?? "");
  const [localEnd, setLocalEnd] = useState(endTime ?? "");

  const timeLabel =
    startTime && endTime
      ? `${startTime.substring(0, 5)} – ${endTime.substring(0, 5)}`
      : startTime
      ? `From ${startTime.substring(0, 5)}`
      : "Full Day";

  const handleSave = () => {
    onSave(localStart || null, localEnd || null);
    setIsEditing(false);
  };

  const handleClear = () => {
    setLocalStart("");
    setLocalEnd("");
    onSave(null, null);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Clock className="size-3.5 text-gray-400 flex-shrink-0" />
        <Input
          type="time"
          value={localStart}
          onChange={(e) => setLocalStart(e.target.value)}
          className="h-7 w-[110px] text-xs"
          placeholder="Start"
          disabled={isPending}
        />
        <span className="text-gray-400 text-xs">–</span>
        <Input
          type="time"
          value={localEnd}
          onChange={(e) => setLocalEnd(e.target.value)}
          className="h-7 w-[110px] text-xs"
          placeholder="End"
          disabled={isPending}
        />
        <Button
          size="sm"
          className="h-7 text-xs px-3"
          onClick={handleSave}
          disabled={isPending}
        >
          Save
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs px-2 text-gray-500"
          onClick={() => {
            setLocalStart(startTime ?? "");
            setLocalEnd(endTime ?? "");
            setIsEditing(false);
          }}
          disabled={isPending}
        >
          Cancel
        </Button>
        {(startTime || endTime) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs px-2 text-gray-400"
            onClick={handleClear}
            disabled={isPending}
          >
            Full Day
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <Clock className="size-3.5 text-gray-400" />
      <span className="text-gray-600">{timeLabel}</span>
      {reservedDates.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs px-2 text-gray-400 hover:text-gray-600"
          onClick={() => setIsEditing(true)}
          disabled={isPending}
        >
          Set Times
        </Button>
      )}
    </div>
  );
}
