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
import { updatePrimaryContact } from "../actions";
import type { BookingWithMeta } from "@/lib/queries/bookings";

interface EditPrimaryContactDialogProps {
  booking: BookingWithMeta;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPrimaryContactDialog({
  booking,
  open,
  onOpenChange,
}: EditPrimaryContactDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    contact_name: booking.contact_name || booking.customer_name || "",
    contact_phone: booking.contact_phone || "",
    customer_email: booking.customer_email,
  });

  const handleSubmit = () => {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.customer_email)) {
      toast.error("Invalid email", {
        description: "Please enter a valid email address.",
      });
      return;
    }

    startTransition(async () => {
      try {
        await updatePrimaryContact(booking.id, {
          contact_name: formData.contact_name || null,
          contact_phone: formData.contact_phone || null,
          customer_email: formData.customer_email,
        });
        toast.success("Contact updated", {
          description: "Primary contact information has been updated successfully.",
        });
        onOpenChange(false);
      } catch (error) {
        toast.error("Failed to update contact", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Primary Contact</DialogTitle>
          <DialogDescription>
            Update the primary contact information for this booking.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="contact-name">Contact Name</Label>
            <Input
              id="contact-name"
              value={formData.contact_name}
              onChange={(e) =>
                setFormData({ ...formData, contact_name: e.target.value })
              }
              placeholder="Enter contact name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contact-phone">Contact Phone</Label>
            <Input
              id="contact-phone"
              type="tel"
              value={formData.contact_phone}
              onChange={(e) =>
                setFormData({ ...formData, contact_phone: e.target.value })
              }
              placeholder="Enter phone number"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="customer-email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="customer-email"
              type="email"
              value={formData.customer_email}
              onChange={(e) =>
                setFormData({ ...formData, customer_email: e.target.value })
              }
              placeholder="Enter email address"
              required
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !formData.customer_email}
          >
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
