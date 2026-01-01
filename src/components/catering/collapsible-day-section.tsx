"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleDaySectionProps {
  date: string;
  formattedDate: string;
  totalJobs: number;
  groupNames: string[];
  isToday: boolean;
  children: React.ReactNode;
}

export function CollapsibleDaySection({
  date,
  formattedDate,
  totalJobs,
  groupNames,
  isToday,
  children,
}: CollapsibleDaySectionProps) {
  // Today starts expanded, other days start collapsed
  const [isExpanded, setIsExpanded] = useState(isToday);

  const groupNamesDisplay = groupNames.join(", ");

  return (
    <section className="space-y-4">
      {/* Collapsible header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="sticky top-0 z-10 w-full bg-white/95 backdrop-blur-sm py-2 border-b border-border/50 cursor-pointer hover:bg-olive-50/50 transition-colors rounded-lg"
      >
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-olive-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-olive-600" />
            )}
            <h3 className="text-lg font-semibold text-text">
              {formattedDate}
            </h3>
            {isToday && (
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                Today
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isExpanded && groupNames.length > 0 && (
              <span className="text-sm text-olive-700 truncate max-w-[200px]">
                for {groupNamesDisplay}
              </span>
            )}
            <span className="text-sm text-text-light">
              {totalJobs} {totalJobs === 1 ? "job" : "jobs"}
            </span>
          </div>
        </div>
      </button>

      {/* Expandable content */}
      {isExpanded && (
        <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </section>
  );
}
