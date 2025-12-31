'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BookingValidationChecks } from '@/lib/validation/booking-approval';

interface ApprovalChecklistProps {
  checks: BookingValidationChecks;
  isOvernight: boolean;
  cateringRequired: boolean;
}

export function ApprovalChecklist({
  checks,
  isOvernight,
  cateringRequired,
}: ApprovalChecklistProps) {
  const allChecksPassed =
    checks.spaceConflicts.passed &&
    checks.roomAllocation.passed &&
    checks.cateringAssignment.passed;

  return (
    <Card className="shadow-soft border-olive-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-text-light">
            Approval Checklist
          </CardTitle>
          {allChecksPassed ? (
            <Badge variant="default" className="gap-1.5 bg-green-600">
              <CheckCircle2 className="size-3.5" />
              Ready to Approve
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1.5">
              <AlertTriangle className="size-3.5" />
              Issues Found
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Space Conflicts Check */}
        <CheckItem
          label="No Space Conflicts"
          passed={checks.spaceConflicts.passed}
          details={
            checks.spaceConflicts.passed
              ? 'All space reservations are conflict-free'
              : `${checks.spaceConflicts.conflictCount} conflict(s) detected`
          }
        />

        {/* Room Allocation Check */}
        {isOvernight && (
          <CheckItem
            label="Room Allocation Complete"
            passed={checks.roomAllocation.passed}
            details={
              checks.roomAllocation.passed
                ? `All ${checks.roomAllocation.requested} room(s) allocated`
                : `${checks.roomAllocation.allocated} of ${checks.roomAllocation.requested} room(s) allocated`
            }
            breakdown={checks.roomAllocation.breakdown}
          />
        )}

        {/* Catering Assignment Check */}
        {cateringRequired && (
          <CheckItem
            label="Catering Assignments Complete"
            passed={checks.cateringAssignment.passed}
            details={
              checks.cateringAssignment.passed
                ? `All ${checks.cateringAssignment.totalMeals} meal(s) configured`
                : `${checks.cateringAssignment.unassignedMeals} of ${checks.cateringAssignment.totalMeals} meal(s) pending`
            }
          />
        )}
      </CardContent>
    </Card>
  );
}

interface CheckItemProps {
  label: string;
  passed: boolean;
  details: string;
  breakdown?: Record<string, { requested: number; allocated: number }>;
}

function CheckItem({ label, passed, details, breakdown }: CheckItemProps) {
  return (
    <div className="rounded-lg border border-border/50 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {passed ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-text">{label}</p>
            <span
              className={cn(
                'text-xs font-semibold',
                passed ? 'text-green-700' : 'text-red-700'
              )}
            >
              {passed ? 'Passed' : 'Failed'}
            </span>
          </div>
          <p className="text-xs text-text-light">{details}</p>

          {breakdown && !passed && (
            <div className="mt-2 space-y-1 text-xs">
              {Object.entries(breakdown).map(([type, data]) => {
                if (data.requested === 0) return null;
                const isComplete = data.allocated >= data.requested;
                return (
                  <div key={type} className="flex justify-between text-text-light">
                    <span>{formatRoomType(type)}:</span>
                    <span className={cn(isComplete ? 'text-green-600' : 'text-red-600')}>
                      {data.allocated} / {data.requested}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatRoomType(type: string): string {
  const mapping: Record<string, string> = {
    doubleBB: 'Double/Queen Rooms',
    singleBB: 'Single Rooms',
    studySuite: 'Study Suites',
    doubleEnsuite: 'Ensuite Rooms',
  };
  return mapping[type] || type;
}
