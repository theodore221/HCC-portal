'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { StickyNote, Save } from 'lucide-react';
import { updateAdminNotes } from '../actions';
import { toast } from 'sonner';

interface AdminNotesCardProps {
  bookingId: string;
  initialNotes: string | null;
}

export function AdminNotesCard({ bookingId, initialNotes }: AdminNotesCardProps) {
  const [notes, setNotes] = useState(initialNotes || '');
  const [isPending, startTransition] = useTransition();
  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateAdminNotes(bookingId, notes);
        setHasChanges(false);
        toast.success('Admin notes updated');
      } catch (error: any) {
        toast.error(error.message || 'Failed to update admin notes');
      }
    });
  };

  const handleChange = (value: string) => {
    setNotes(value);
    setHasChanges(value !== (initialNotes || ''));
  };

  return (
    <Card className="shadow-soft border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-text-light flex items-center gap-2">
          <StickyNote className="h-4 w-4" />
          Internal Admin Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={notes}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Add internal notes about this booking (not visible to customer)..."
          rows={6}
          className="resize-none"
        />
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {hasChanges ? 'Unsaved changes' : 'Saved'}
          </span>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isPending}
            size="sm"
            className="gap-1.5"
          >
            <Save className="h-3.5 w-3.5" />
            {isPending ? 'Saving...' : 'Save Notes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
