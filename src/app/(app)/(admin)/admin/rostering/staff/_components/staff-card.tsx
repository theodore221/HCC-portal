"use client";

import { useState } from "react";
import { Phone, AlertCircle, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { StaffMember } from "@/lib/queries/rostering.server";
import { EditStaffDialog } from "./edit-staff-dialog";

type Props = { member: StaffMember };

export function StaffCard({ member }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const record = member.staff_record;
  const initials = (member.full_name ?? member.email)
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <Card className="hover:border-gray-300 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-gray-900">
                  {member.full_name ?? member.email}
                </p>
                {member.role === "admin" && (
                  <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 truncate">{member.email}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {!record?.active && (
                <span className="text-xs text-gray-400">Inactive</span>
              )}
              {record && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-gray-400 hover:text-gray-700"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="size-3.5" />
                </Button>
              )}
            </div>
          </div>

          {(record?.phone || record?.emergency_contact_name) && (
            <div className="mt-3 space-y-1 text-xs text-gray-500 border-t border-gray-100 pt-3">
              {record.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="size-3" />
                  {record.phone}
                </div>
              )}
              {record.emergency_contact_name && (
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="size-3" />
                  EC: {record.emergency_contact_name}
                  {record.emergency_contact_phone && ` · ${record.emergency_contact_phone}`}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {record && (
        <EditStaffDialog
          member={member}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
    </>
  );
}
