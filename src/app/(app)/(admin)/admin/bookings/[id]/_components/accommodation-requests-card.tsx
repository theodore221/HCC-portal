'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Pencil, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { updateAccommodationRequests } from '../actions';

interface AccommodationRequests {
  doubleBB: number;
  singleBB: number;
  studySuite: number;
  doubleEnsuite: number;
  byo_linen: boolean;
}

interface AllocatedCounts {
  doubleBB: number;
  singleBB: number;
  studySuite: number;
  doubleEnsuite: number;
}

interface AccommodationRequestsCardProps {
  bookingId: string;
  requests: AccommodationRequests;
  allocated: AllocatedCounts;
}

export function AccommodationRequestsCard({
  bookingId,
  requests: initialRequests,
  allocated,
}: AccommodationRequestsCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [requests, setRequests] = useState<AccommodationRequests>(initialRequests);

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateAccommodationRequests(bookingId, requests);
        setIsEditing(false);
        toast({
          title: 'Accommodation requests updated',
          description: 'The accommodation requests have been successfully updated.',
        });
      } catch (error) {
        toast({
          title: 'Failed to update',
          description:
            error instanceof Error ? error.message : 'An error occurred',
          variant: 'destructive',
        });
      }
    });
  };

  const handleCancel = () => {
    setRequests(initialRequests);
    setIsEditing(false);
  };

  const accommodationTypes = [
    {
      key: 'singleBB' as const,
      label: 'Single Bed',
      description: 'Single bed accommodation',
    },
    {
      key: 'doubleBB' as const,
      label: 'Double/Queen Bed',
      description: 'Double or Queen bed accommodation',
    },
    {
      key: 'doubleEnsuite' as const,
      label: 'Ensuite Rooms',
      description: 'Rooms with ensuite bathroom',
    },
    {
      key: 'studySuite' as const,
      label: 'Study Suite',
      description: 'Double bed with ensuite and private study',
    },
  ];

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-text-light">
            Accommodation Requests
          </CardTitle>
          {!isEditing ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-8 gap-1.5"
            >
              <Pencil className="size-3.5" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={isPending}
                className="h-8 gap-1.5"
              >
                <X className="size-3.5" />
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSave}
                disabled={isPending}
                className="h-8 gap-1.5"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="size-3.5" />
                    Save
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* BYO Linen Option */}
        <div className="flex items-center justify-between rounded-lg border border-border/50 bg-neutral-50 px-4 py-3">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor="byo-linen" className="text-sm font-medium">
              BYO Linen
            </Label>
            <p className="text-xs text-muted-foreground">
              Guests bringing their own linen
            </p>
          </div>
          <Switch
            id="byo-linen"
            checked={requests.byo_linen}
            onCheckedChange={(checked) =>
              setRequests((prev) => ({ ...prev, byo_linen: checked }))
            }
            disabled={!isEditing}
          />
        </div>

        {/* Accommodation Types Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {accommodationTypes.map(({ key, label, description }) => {
            const requested = requests[key];
            const allocatedCount = allocated[key];
            const percentage = requested > 0
              ? Math.min(100, Math.round((allocatedCount / requested) * 100))
              : 0;
            const isComplete = allocatedCount >= requested;

            return (
              <div
                key={key}
                className="space-y-2 rounded-lg border border-border/50 bg-white p-4"
              >
                {/* Header with label and count */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-olive-800">
                      {label}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {description}
                    </p>
                  </div>
                  {isEditing ? (
                    <Input
                      type="number"
                      min="0"
                      value={requested}
                      onChange={(e) => {
                        const value = Math.max(0, parseInt(e.target.value) || 0);
                        setRequests((prev) => ({ ...prev, [key]: value }));
                      }}
                      className="h-9 w-20 text-center"
                    />
                  ) : (
                    <div className="flex flex-col items-end">
                      <span className="text-2xl font-bold text-olive-900">
                        {requested}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        requested
                      </span>
                    </div>
                  )}
                </div>

                {/* Progress bar and allocation count */}
                {requested > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-olive-700">
                        Allocated
                      </span>
                      <span
                        className={cn(
                          'font-semibold',
                          isComplete ? 'text-olive-600' : 'text-olive-900'
                        )}
                      >
                        {allocatedCount} / {requested}
                      </span>
                    </div>
                    <Progress
                      value={percentage}
                      className={cn(
                        'h-2',
                        isComplete && '[&>div]:bg-olive-500'
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
