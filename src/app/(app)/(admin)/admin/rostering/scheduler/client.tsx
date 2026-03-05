"use client";

import { useState } from "react";
import { CalendarDays, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ShiftCalendar } from "../_components/shift-calendar";
import { ShiftCard } from "../_components/shift-card";
import { ShiftDetailPanel } from "../_components/shift-detail-panel";
import { AddShiftDialog } from "../_components/add-shift-dialog";
import type {
  ShiftCalendarDay,
  ShiftDetail,
  ShiftRow,
  StaffMember,
  RosterJob,
} from "@/lib/queries/rostering.server";

type Props = {
  initialYear: number;
  initialMonth: number;
  initialCalendarData: ShiftCalendarDay[];
  staff: StaffMember[];
  jobs: RosterJob[];
};

export function SchedulerClient({
  initialYear,
  initialMonth,
  initialCalendarData,
  staff,
  jobs,
}: Props) {
  const [calendarData, setCalendarData] = useState(initialCalendarData);
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [shiftsForDate, setShiftsForDate] = useState<ShiftRow[]>([]);
  const [selectedShift, setSelectedShift] = useState<ShiftDetail | null>(null);
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  async function handleSelectDate(date: string) {
    setSelectedDate(date);
    setSelectedShift(null);
    setLoadingShifts(true);
    try {
      const res = await fetch(`/api/rostering/shifts-for-date?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setShiftsForDate(data);
      }
    } finally {
      setLoadingShifts(false);
    }
  }

  async function handleSelectShift(shiftId: string) {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/rostering/shift-detail?id=${shiftId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedShift(data);
      }
    } finally {
      setLoadingDetail(false);
    }
  }

  async function refreshCalendar(year = currentYear, month = currentMonth) {
    const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    try {
      const res = await fetch(
        `/api/rostering/calendar-data?start=${startDate}&end=${endDate}`
      );
      if (res.ok) {
        const data = await res.json();
        setCalendarData(data);
      }
    } catch {}
  }

  async function handleShiftDeleted() {
    setSelectedShift(null);
    await Promise.all([
      selectedDate ? handleSelectDate(selectedDate) : Promise.resolve(),
      refreshCalendar(),
    ]);
  }

  async function handleShiftUpdated() {
    await Promise.all([
      selectedShift ? handleSelectShift(selectedShift.id) : Promise.resolve(),
      selectedDate ? handleSelectDate(selectedDate) : Promise.resolve(),
      refreshCalendar(),
    ]);
  }

  async function handleMonthChange(year: number, month: number) {
    setCurrentYear(year);
    setCurrentMonth(month);
    await refreshCalendar(year, month);
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[460px_1fr]">
      {/* Left: Calendar */}
      <Card>
        <CardContent className="p-5">
          <ShiftCalendar
            initialYear={initialYear}
            initialMonth={initialMonth}
            calendarData={calendarData}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            onMonthChange={handleMonthChange}
          />
        </CardContent>
      </Card>

      {/* Right: Day panel */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-500">
            {selectedDate
              ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-AU", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "Select a day to view shifts"}
          </h3>
          {selectedDate && (
            <AddShiftDialog
              defaultDate={selectedDate}
              staff={staff}
              jobs={jobs}
              onCreated={async () => {
                await Promise.all([
                  selectedDate ? handleSelectDate(selectedDate) : Promise.resolve(),
                  refreshCalendar(),
                ]);
              }}
            />
          )}
        </div>

        {!selectedDate && (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
              <CalendarDays className="size-7 text-gray-300" />
              <p className="text-sm text-gray-400">Select a day to view or add shifts</p>
            </CardContent>
          </Card>
        )}

        {selectedDate && loadingShifts && (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        )}

        {selectedDate && !loadingShifts && shiftsForDate.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <Clock className="size-6 text-gray-300" />
              <p className="text-sm text-gray-400">No shifts on this day</p>
            </CardContent>
          </Card>
        )}

        {selectedDate && !loadingShifts && shiftsForDate.length > 0 && (
          <div className="space-y-2">
            {shiftsForDate.map((shift) => (
              <ShiftCard
                key={shift.id}
                id={shift.id}
                title={shift.title}
                startTime={shift.start_time}
                endTime={shift.end_time}
                assignedCount={shift.assigned_count}
                isSelected={selectedShift?.id === shift.id}
                onClick={() => handleSelectShift(shift.id)}
              />
            ))}
          </div>
        )}

        {/* Shift detail */}
        {loadingDetail && (
          <div className="h-48 rounded-xl bg-gray-100 animate-pulse" />
        )}
        {selectedShift && !loadingDetail && (
          <ShiftDetailPanel
            shift={selectedShift}
            staff={staff}
            jobs={jobs}
            onDeleted={handleShiftDeleted}
            onUpdated={handleShiftUpdated}
          />
        )}
      </div>
    </div>
  );
}
