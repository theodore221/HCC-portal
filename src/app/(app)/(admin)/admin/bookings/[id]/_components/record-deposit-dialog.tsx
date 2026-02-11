"use client";
import { toast } from 'sonner';

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { recordDeposit } from "../actions";

interface RecordDepositDialogProps {
  bookingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecordDepositDialog({
  bookingId,
  open,
  onOpenChange,
}: RecordDepositDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [depositReference, setDepositReference] = useState("");

  const handleSubmit = () => {
    startTransition(async () => {
      try {
        await recordDeposit(bookingId, depositReference || undefined);
        toast.success("Deposit recorded", {
          description: "The deposit has been successfully recorded.",
        });
        onOpenChange(false);
        setDepositReference("");
      } catch (error) {
        toast.error("Failed to record deposit", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Deposit</DialogTitle>
          <DialogDescription>
            Enter the deposit reference number (optional) and confirm to mark
            the deposit as paid.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="deposit-reference">Deposit Reference</Label>
            <Input
              id="deposit-reference"
              value={depositReference}
              onChange={(e) => setDepositReference(e.target.value)}
              placeholder="e.g., TRX123456"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Recording..." : "Record Deposit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
