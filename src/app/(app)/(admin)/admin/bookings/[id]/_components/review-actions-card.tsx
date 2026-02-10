'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { approveBookingWithNotes, rejectBooking, updateBookingStatus } from '../actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { BookingValidationChecks } from '@/lib/validation/booking-approval';

interface ReviewActionsCardProps {
  bookingId: string;
  bookingStatus: string;
  validationChecks: BookingValidationChecks;
}

export function ReviewActionsCard({
  bookingId,
  bookingStatus,
  validationChecks,
}: ReviewActionsCardProps) {
  const [isPending, startTransition] = useTransition();
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');

  const allChecksPassed =
    validationChecks.spaceConflicts.passed &&
    validationChecks.roomAllocation.passed &&
    validationChecks.cateringAssignment.passed;

  const isPendingReview = bookingStatus === 'pending_admin_review' || bookingStatus === 'Pending';

  if (!isPendingReview) {
    return null;
  }

  const handleApprove = () => {
    if (!allChecksPassed) {
      toast.error('Cannot approve booking with validation errors. Please resolve all issues first.');
      return;
    }

    startTransition(async () => {
      try {
        await approveBookingWithNotes(bookingId, approvalNotes || undefined);
        toast.success('Booking approved successfully!');
        setApprovalNotes('');
      } catch (error: any) {
        toast.error(error.message || 'Failed to approve booking');
      }
    });
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    startTransition(async () => {
      try {
        await rejectBooking(bookingId, rejectReason);
        toast.success('Booking rejected');
        setShowRejectForm(false);
        setRejectReason('');
      } catch (error: any) {
        toast.error(error.message || 'Failed to reject booking');
      }
    });
  };

  const handleSendToFinance = () => {
    startTransition(async () => {
      try {
        await updateBookingStatus(bookingId, 'with_finance' as any);
        toast.success('Booking sent to finance for quote');
      } catch (error: any) {
        toast.error(error.message || 'Failed to update status');
      }
    });
  };

  return (
    <Card className={cn(
      "shadow-soft border-2",
      allChecksPassed ? "border-green-200 bg-green-50/50" : "border-yellow-200 bg-yellow-50/50"
    )}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-text-light">
          Review Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!allChecksPassed && (
          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-700 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-yellow-800">
              <p className="font-medium mb-1">Validation Issues Detected</p>
              <p>Please resolve all validation errors before approving this booking.</p>
            </div>
          </div>
        )}

        {!showRejectForm ? (
          <>
            {/* Approval Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Approval Notes (Optional)
              </label>
              <Textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Add any notes about this approval..."
                rows={3}
                className="resize-none text-sm"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                onClick={handleApprove}
                disabled={!allChecksPassed || isPending}
                className="w-full gap-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4" />
                {isPending ? 'Approving...' : 'Approve Booking'}
              </Button>

              <Button
                onClick={handleSendToFinance}
                disabled={isPending}
                variant="outline"
                className="w-full gap-2"
              >
                Send to Finance for Quote
              </Button>

              <Button
                onClick={() => setShowRejectForm(true)}
                disabled={isPending}
                variant="destructive"
                className="w-full gap-2"
              >
                <XCircle className="h-4 w-4" />
                Reject Booking
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Reject Form */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Rejection Reason *
              </label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this booking is being rejected..."
                rows={4}
                className="resize-none text-sm"
              />

              <div className="flex gap-2">
                <Button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || isPending}
                  variant="destructive"
                  className="flex-1"
                >
                  {isPending ? 'Rejecting...' : 'Confirm Rejection'}
                </Button>
                <Button
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectReason('');
                  }}
                  disabled={isPending}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
