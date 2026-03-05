"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { StaffMember } from "@/lib/queries/rostering.server";
import { StaffCard } from "./_components/staff-card";
import { AddStaffDialog } from "./_components/add-staff-dialog";

type Props = { staff: StaffMember[] };

export function StaffClient({ staff }: Props) {
  const [query, setQuery] = useState("");

  const active = staff.filter((s) => s.staff_record?.active !== false);
  const inactive = staff.filter((s) => s.staff_record?.active === false);

  const q = query.toLowerCase().trim();
  const filteredActive = q ? active.filter((s) => s.full_name?.toLowerCase().includes(q)) : active;
  const filteredInactive = q ? inactive.filter((s) => s.full_name?.toLowerCase().includes(q)) : inactive;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search staff…"
            className="pl-9 pr-8 rounded-full border-gray-200"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <AddStaffDialog />
      </div>

      {active.length === 0 && !query && (
        <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-400">
          No staff members yet. Add one to get started.
        </div>
      )}

      {filteredActive.length === 0 && query && (
        <p className="text-sm text-gray-400 py-4 text-center">No staff match "{query}"</p>
      )}

      {filteredActive.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-3">
            {active.length} active{q ? ` · ${filteredActive.length} shown` : ""}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredActive.map((member) => (
              <StaffCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      )}

      {filteredInactive.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-3">
            {inactive.length} inactive{q ? ` · ${filteredInactive.length} shown` : ""}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 opacity-60">
            {filteredInactive.map((member) => (
              <StaffCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
