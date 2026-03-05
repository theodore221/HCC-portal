"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Calendar, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteUnavailabilityPeriod } from "../../actions";
import type { UnavailabilityPeriod } from "@/lib/queries/rostering.server";

function formatDate(d: string): string {
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-AU", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function PeriodRow({ period }: { period: UnavailabilityPeriod }) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteUnavailabilityPeriod(period.id);
        toast.success("Period removed");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to remove period");
      }
    });
  }

  return (
    <Card className="hover:border-gray-300 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-sm text-gray-700">
              <Calendar className="size-3.5 text-gray-400 flex-shrink-0" />
              <span className="font-medium">
                {formatDate(period.start_date)}
                {period.start_date !== period.end_date && ` – ${formatDate(period.end_date)}`}
              </span>
            </div>
            {period.reason && (
              <p className="mt-1 text-xs text-gray-500">{period.reason}</p>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-gray-400 hover:text-status-clay flex-shrink-0"
            onClick={handleDelete}
            disabled={pending}
            aria-label="Remove period"
          >
            <X className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

type Props = { periods: UnavailabilityPeriod[] };

export function UnavailabilityHistory({ periods }: Props) {
  if (periods.length === 0) {
    return (
      <div className="text-center text-sm text-gray-400 py-8">
        No unavailability periods yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {periods.map((p) => (
        <PeriodRow key={p.id} period={p} />
      ))}
    </div>
  );
}
