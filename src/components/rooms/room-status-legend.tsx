"use client";

import { CheckCircle2, Sparkles, Wrench, Users } from "lucide-react";

export function RoomStatusLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-card p-4 text-sm">
      <span className="font-medium text-neutral-700">Status Legend:</span>

      <div className="flex items-center gap-1.5">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-neutral-100">
          <CheckCircle2 className="h-3 w-3 text-neutral-700" />
        </div>
        <span className="text-neutral-600">Ready</span>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-100">
          <Wrench className="h-3 w-3 text-blue-700" />
        </div>
        <span className="text-neutral-600">Needs Setup</span>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-green-100">
          <CheckCircle2 className="h-3 w-3 text-green-700" />
        </div>
        <span className="text-neutral-600">Setup Complete</span>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-rose-100">
          <Users className="h-3 w-3 text-rose-700" />
        </div>
        <span className="text-neutral-600">In Use</span>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-amber-100">
          <Sparkles className="h-3 w-3 text-amber-700" />
        </div>
        <span className="text-neutral-600">Cleaning Required</span>
      </div>
    </div>
  );
}
