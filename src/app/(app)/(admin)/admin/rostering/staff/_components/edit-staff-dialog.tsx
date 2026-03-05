"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { StaffMember } from "@/lib/queries/rostering.server";
import { updateStaffRecord, deactivateStaffMember } from "../../actions";

type Props = {
  member: StaffMember;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditStaffDialog({ member, open, onOpenChange }: Props) {
  const record = member.staff_record;
  const [pending, startTransition] = useTransition();
  const [phone, setPhone] = useState(record?.phone ?? "");
  // Position is derived from the profile role — capitalise it for display/storage
  const derivedPosition = member.role.charAt(0).toUpperCase() + member.role.slice(1);
  const [position] = useState(derivedPosition);
  const [ecName, setEcName] = useState(record?.emergency_contact_name ?? "");
  const [ecPhone, setEcPhone] = useState(record?.emergency_contact_phone ?? "");
  const [notes, setNotes] = useState(record?.notes ?? "");

  if (!record) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateStaffRecord(record!.id, {
          phone: phone || null,
          position: position || null,
          emergency_contact_name: ecName || null,
          emergency_contact_phone: ecPhone || null,
          notes: notes || null,
        });
        toast.success("Staff record updated.");
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update staff record");
      }
    });
  }

  function handleDeactivate() {
    startTransition(async () => {
      try {
        await deactivateStaffMember(record!.id);
        toast.success(`${member.full_name ?? member.email} deactivated.`);
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to deactivate staff member");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {member.full_name ?? member.email}</DialogTitle>
        </DialogHeader>
        <div className="px-1 py-2 bg-gray-50 rounded-md border border-gray-100">
          <p className="text-xs text-gray-500">Email</p>
          <p className="text-sm text-gray-900">{member.email}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="04xx xxx xxx" />
            </div>
            <div className="space-y-1.5">
              <Label>Position</Label>
              <div className="flex h-9 items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700">
                {position}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3 space-y-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Emergency contact</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={ecName} onChange={(e) => setEcName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={ecPhone} onChange={(e) => setEcPhone(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-gray-100">
            {record.active ? (
              <Button
                type="button"
                variant="ghost"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 text-sm"
                onClick={handleDeactivate}
                disabled={pending}
              >
                Deactivate
              </Button>
            ) : (
              <span className="text-xs text-gray-400">Inactive member</span>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
