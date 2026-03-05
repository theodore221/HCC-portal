"use client";

import { useEffect, useState, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import type { StaffMember, StaffAvailability } from "@/lib/queries/rostering.server";

type Props = {
  staff: StaffMember[];
  selectedStaff: string[];
  onToggleStaff: (id: string) => void;
  shiftDate: string;
  startTime: string;
  endTime: string;
  onUnavailableIdsChange?: (ids: Set<string>) => void;
};

export function StaffAvailabilityList({
  staff,
  selectedStaff,
  onToggleStaff,
  shiftDate,
  startTime,
  endTime,
  onUnavailableIdsChange,
}: Props) {
  const [availability, setAvailability] = useState<StaffAvailability[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!shiftDate || !startTime || !endTime) {
      debounceRef.current = setTimeout(() => {
        setAvailability([]);
        onUnavailableIdsChange?.(new Set());
      }, 0);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ date: shiftDate, start: startTime, end: endTime });
        const res = await fetch(`/api/rostering/staff-availability?${params}`);
        if (res.ok) {
          const data: StaffAvailability[] = await res.json();
          setAvailability(data);
          const ids = new Set(
            data
              .filter((a) => a.has_period_unavailability || a.has_weekly_unavailability)
              .map((a) => a.staff_profile_id)
          );
          onUnavailableIdsChange?.(ids);
        }
      } catch {
        // Silently fail — fall back to no-availability-info display
        setAvailability([]);
        onUnavailableIdsChange?.(new Set());
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [shiftDate, startTime, endTime]);

  const availabilityMap = new Map(availability.map((a) => [a.staff_profile_id, a]));

  const available = staff.filter((s) => {
    const a = availabilityMap.get(s.id);
    return !a || (!a.has_period_unavailability && !a.has_weekly_unavailability);
  });

  const unavailable = staff.filter((s) => {
    const a = availabilityMap.get(s.id);
    return a && (a.has_period_unavailability || a.has_weekly_unavailability);
  });

  function unavailabilityReason(s: StaffMember): string {
    const a = availabilityMap.get(s.id);
    if (!a) return "";
    if (a.has_period_unavailability) return `Away: ${a.period_reason ?? "unavailable"}`;
    if (a.has_weekly_unavailability) return "Recurring: unavailable this time";
    return "";
  }

  return (
    <div className="rounded-lg border border-gray-200 divide-y divide-gray-100 max-h-48 overflow-y-auto">
      {/* Available staff */}
      {available.map((s) => (
        <label
          key={s.id}
          className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50"
        >
          <input
            type="checkbox"
            checked={selectedStaff.includes(s.id)}
            onChange={() => onToggleStaff(s.id)}
            className="rounded"
          />
          <span className="text-sm text-gray-700">{s.full_name ?? s.email}</span>
        </label>
      ))}

      {/* Divider — only shown when there are unavailable staff */}
      {unavailable.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50/50 sticky top-0">
          <div className="flex-1 border-t border-gray-200" />
          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            Unavailable
          </span>
          <div className="flex-1 border-t border-gray-200" />
        </div>
      )}

      {/* Unavailable staff */}
      {unavailable.map((s) => {
        const isSelected = selectedStaff.includes(s.id);
        return (
        <label
          key={s.id}
          className={`flex items-center gap-3 px-3 py-2 bg-gray-50 opacity-60 ${isSelected ? "cursor-pointer hover:bg-gray-100" : "cursor-not-allowed"}`}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleStaff(s.id)}
            className="rounded"
            disabled={!isSelected}
          />
          <span className="text-sm text-gray-700 flex-1 min-w-0">
            {s.full_name ?? s.email}
          </span>
          <span className="flex items-center gap-1 flex-shrink-0">
            <AlertTriangle className="size-3 text-status-ochre" />
            <span className="text-xs text-gray-400 truncate max-w-[160px]">
              {unavailabilityReason(s)}
            </span>
          </span>
        </label>
        );
      })}

      {staff.length === 0 && (
        <div className="px-3 py-4 text-center text-xs text-gray-400">No staff members</div>
      )}
    </div>
  );
}
