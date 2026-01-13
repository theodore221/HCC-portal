-- Migration: Room Status Logs
-- Description: Create table to track staff actions on rooms (cleaning, setup completion)
-- for housekeeping and room preparation management

-- Create room_status_logs table
CREATE TABLE IF NOT EXISTS public.room_status_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('cleaned', 'setup_complete')),
  action_date DATE NOT NULL,
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  notes TEXT,

  -- Composite unique constraint: one action per room per date per type
  CONSTRAINT unique_room_action_per_date UNIQUE (room_id, action_date, action_type)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_room_status_logs_room_date
  ON public.room_status_logs(room_id, action_date);

CREATE INDEX IF NOT EXISTS idx_room_status_logs_action_date
  ON public.room_status_logs(action_date);

CREATE INDEX IF NOT EXISTS idx_room_status_logs_performed_by
  ON public.room_status_logs(performed_by);

-- Enable Row Level Security
ALTER TABLE public.room_status_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Staff and Admin can read all logs
CREATE POLICY "Staff and Admin can read room status logs"
  ON public.room_status_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('staff', 'admin')
    )
  );

-- RLS Policy: Staff and Admin can insert logs
CREATE POLICY "Staff and Admin can insert room status logs"
  ON public.room_status_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('staff', 'admin')
    )
  );

-- RLS Policy: Staff and Admin can update their own logs
CREATE POLICY "Staff and Admin can update room status logs"
  ON public.room_status_logs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('staff', 'admin')
    )
  );

-- RLS Policy: Staff and Admin can delete logs
CREATE POLICY "Staff and Admin can delete room status logs"
  ON public.room_status_logs
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('staff', 'admin')
    )
  );

-- Add comment to table
COMMENT ON TABLE public.room_status_logs IS
  'Tracks staff actions on rooms for housekeeping and setup management';

COMMENT ON COLUMN public.room_status_logs.action_type IS
  'Type of action: cleaned (after guest departure) or setup_complete (before guest arrival)';

COMMENT ON COLUMN public.room_status_logs.action_date IS
  'The date the action applies to (not necessarily when it was performed)';
