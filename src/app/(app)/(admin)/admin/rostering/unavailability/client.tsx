"use client";

import { Calendar, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { UnavailabilityPeriod } from "@/lib/queries/rostering.server";

function formatDate(d: string): string {
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-AU", {
    day: "numeric", month: "short", year: "numeric",
  });
}

type Props = { periods: UnavailabilityPeriod[] };

export function AdminUnavailabilityClient({ periods }: Props) {
  // Group by staff name for readability
  const byStaff = periods.reduce<Record<string, UnavailabilityPeriod[]>>((acc, p) => {
    const key = p.staff_name ?? p.staff_profile_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  if (periods.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-400">
        No unavailability periods recorded
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(byStaff).map(([staffName, staffPeriods]) => (
        <div key={staffName} className="space-y-2">
          <h3 className="flex items-center gap-1.5 text-sm font-medium text-gray-600">
            <User className="size-3.5 text-gray-400" />
            {staffName}
            <span className="text-gray-400 font-normal">({staffPeriods.length})</span>
          </h3>
          {staffPeriods.map((p) => (
            <Card key={p.id} className="hover:border-gray-300 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Calendar className="size-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-800">
                      {formatDate(p.start_date)}
                      {p.start_date !== p.end_date && (
                        <> &ndash; {formatDate(p.end_date)}</>
                      )}
                    </p>
                    {p.reason && (
                      <p className="mt-0.5 text-xs text-gray-500">{p.reason}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
}
