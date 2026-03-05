"use client";

import { useState } from "react";
import { CalendarGrid, type CalendarDayData } from "@/components/ui/calendar-grid";
import type { ShiftCalendarDay } from "@/lib/queries/rostering.server";

type ShiftCalendarProps = {
  initialYear: number;
  initialMonth: number;
  calendarData: ShiftCalendarDay[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onMonthChange: (year: number, month: number) => void;
};

export function ShiftCalendar({
  initialYear,
  initialMonth,
  calendarData,
  selectedDate,
  onSelectDate,
  onMonthChange,
}: ShiftCalendarProps) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);

  const dayData: CalendarDayData[] = calendarData.map((d) => ({
    date: d.shift_date,
    dotCount: Math.min(d.total_shifts, 4),
    hasAlert: d.has_unresponded,
    allAccepted: d.all_accepted,
  }));

  function prevMonth() {
    const newMonth = month === 0 ? 11 : month - 1;
    const newYear = month === 0 ? year - 1 : year;
    setMonth(newMonth);
    setYear(newYear);
    onMonthChange(newYear, newMonth);
  }

  function nextMonth() {
    const newMonth = month === 11 ? 0 : month + 1;
    const newYear = month === 11 ? year + 1 : year;
    setMonth(newMonth);
    setYear(newYear);
    onMonthChange(newYear, newMonth);
  }

  return (
    <CalendarGrid
      year={year}
      month={month}
      dayData={dayData}
      selectedDate={selectedDate}
      onSelectDate={onSelectDate}
      onPrevMonth={prevMonth}
      onNextMonth={nextMonth}
      view="month"
    />
  );
}
