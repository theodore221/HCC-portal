"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitUnavailabilityPeriod } from "../../actions";

type Props = { onSuccess?: () => void };

export function UnavailabilityForm({ onSuccess }: Props) {
  const [pending, startTransition] = useTransition();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (endDate < startDate) {
      toast.error("End date must be on or after start date.");
      return;
    }
    startTransition(async () => {
      try {
        await submitUnavailabilityPeriod({
          start_date: startDate,
          end_date: endDate,
          reason: reason || null,
        });
        toast.success("Unavailability period saved");
        setStartDate("");
        setEndDate("");
        setReason("");
        onSuccess?.();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save unavailability");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Start date</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>End date</Label>
          <Input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Reason (optional)</Label>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="e.g. Travelling overseas, family commitment..."
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button
          type="submit"
          disabled={pending || !startDate || !endDate}
        >
          {pending ? "Saving…" : "Save period"}
        </Button>
      </div>
    </form>
  );
}
