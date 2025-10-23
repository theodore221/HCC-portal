"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import type { EventClickArg, DateClickArg, DatesSetArg } from "@fullcalendar/core";

import { MealSlotCard } from "@/components/ui/meal-slot-card";
import { formatDateLabel } from "@/lib/catering";
import type { EnrichedMealJob } from "@/lib/catering";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  ssr: false,
});

interface CateringJobsCalendarProps {
  jobs: EnrichedMealJob[];
}

export function CateringJobsCalendar({ jobs }: CateringJobsCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(
    jobs[0]?.date ?? new Date().toISOString().slice(0, 10)
  );
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [visibleRange, setVisibleRange] = useState<DatesSetArg | null>(null);

  const events = useMemo(
    () =>
      jobs.map((job) => ({
        id: job.id,
        title: `${job.groupName} • ${job.timeSlot}`,
        start: job.startISOString,
        end: job.endISOString,
      })),
    [jobs]
  );

  const jobsForSelectedDate = useMemo(
    () => jobs.filter((job) => job.date === selectedDate),
    [jobs, selectedDate]
  );

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId) ?? null,
    [jobs, selectedJobId]
  );

  const handleDateClick = (info: DateClickArg) => {
    setSelectedDate(info.dateStr);
    setSelectedJobId(null);
  };

  const handleEventClick = (info: EventClickArg) => {
    const eventDate = info.event.startStr.slice(0, 10);
    setSelectedDate(eventDate);
    setSelectedJobId(info.event.id);
  };

  const handleDatesSet = (arg: DatesSetArg) => {
    setVisibleRange(arg);
  };

  return (
    <div className="space-y-4">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        height="auto"
        headerToolbar={{ left: "prev,next today", center: "title", right: "" }}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        dayMaxEventRows={3}
        eventDisplay="block"
        datesSet={handleDatesSet}
      />
      <div className="space-y-3 rounded-xl border border-olive-100 bg-white/70 p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-olive-600">
              {visibleRange?.view.title ?? "Selected day"}
            </p>
            <h3 className="text-base font-semibold text-olive-900">
              {formatDateLabel(selectedDate)}
            </h3>
          </div>
          <span className="text-xs font-medium text-olive-700">
            {jobsForSelectedDate.length} {jobsForSelectedDate.length === 1 ? "service" : "services"}
          </span>
        </div>
        {jobsForSelectedDate.length ? (
          <div className="space-y-4">
            {jobsForSelectedDate.map((job) => (
              <div key={job.id} className="space-y-2">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-semibold text-olive-800">{job.groupName}</p>
                  <span className="text-xs text-olive-700">{job.timeRangeLabel}</span>
                </div>
                <MealSlotCard job={job} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-olive-700">
            No catering services scheduled for this day.
          </p>
        )}
        {selectedJob ? (
          <div className="rounded-lg border border-olive-200 bg-olive-50 p-3 text-xs text-olive-700">
            <p className="font-semibold text-olive-900">Selected service</p>
            <p className="font-medium text-olive-800">{selectedJob.groupName}</p>
            <p>{selectedJob.timeRangeLabel}</p>
            <p>Assigned caterer: {selectedJob.assignedCaterer ?? "Unassigned"}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
