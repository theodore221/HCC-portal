"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { updateBookingSpecifics } from "../actions";
import type { BookingWithMeta } from "@/lib/queries/bookings";

interface EditBookingSpecificsDialogProps {
  booking: BookingWithMeta;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditBookingSpecificsDialog({
  booking,
  open,
  onOpenChange,
}: EditBookingSpecificsDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    booking_type: booking.booking_type as "Group" | "Individual",
    headcount: booking.headcount,
    catering_required: booking.catering_required,
    arrival_date: booking.arrival_date,
    departure_date: booking.departure_date,
    arrival_time: booking.arrival_time || "",
    departure_time: booking.departure_time || "",
  });

  const handleSubmit = () => {
    // Validate headcount
    if (formData.headcount < 1) {
      toast({
        variant: "destructive",
        title: "Invalid headcount",
        description: "Headcount must be at least 1.",
      });
      return;
    }

    // Validate dates
    const arrival = new Date(formData.arrival_date);
    const departure = new Date(formData.departure_date);
    if (departure < arrival) {
      toast({
        variant: "destructive",
        title: "Invalid dates",
        description: "Departure date cannot be before arrival date.",
      });
      return;
    }

    startTransition(async () => {
      try {
        await updateBookingSpecifics(booking.id, {
          ...formData,
          arrival_time: formData.arrival_time || null,
          departure_time: formData.departure_time || null,
        });
        toast({
          title: "Booking updated",
          description: "Booking details have been updated successfully.",
        });
        onOpenChange(false);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to update booking",
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Booking Specifics</DialogTitle>
          <DialogDescription>
            Update the booking details including type, dates, headcount, and catering.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
          <div className="grid gap-2">
            <Label htmlFor="booking-type">Booking Type</Label>
            <Select
              value={formData.booking_type}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  booking_type: value as "Group" | "Individual",
                })
              }
            >
              <SelectTrigger id="booking-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="Group">Group</SelectItem>
                <SelectItem value="Individual">Individual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="headcount">
              Headcount <span className="text-red-500">*</span>
            </Label>
            <Input
              id="headcount"
              type="number"
              min="1"
              value={formData.headcount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  headcount: parseInt(e.target.value) || 0,
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="catering-required">Catering Required</Label>
            <Switch
              id="catering-required"
              checked={formData.catering_required}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, catering_required: checked })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="arrival-date">
              Arrival Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="arrival-date"
              type="date"
              value={formData.arrival_date}
              onChange={(e) =>
                setFormData({ ...formData, arrival_date: e.target.value })
              }
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="arrival-time">Arrival Time</Label>
            <Input
              id="arrival-time"
              type="time"
              value={formData.arrival_time}
              onChange={(e) =>
                setFormData({ ...formData, arrival_time: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="departure-date">
              Departure Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="departure-date"
              type="date"
              value={formData.departure_date}
              onChange={(e) =>
                setFormData({ ...formData, departure_date: e.target.value })
              }
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="departure-time">Departure Time</Label>
            <Input
              id="departure-time"
              type="time"
              value={formData.departure_time}
              onChange={(e) =>
                setFormData({ ...formData, departure_time: e.target.value })
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !formData.arrival_date || !formData.departure_date}
          >
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
