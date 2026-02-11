-- Create enquiry_notes table for CRM activity tracking
CREATE TABLE IF NOT EXISTS public.enquiry_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id UUID NOT NULL REFERENCES public.enquiries(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'note'
    CHECK (note_type IN ('note', 'phone_call', 'email', 'status_change', 'quote_created', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for enquiry_notes
CREATE INDEX idx_enquiry_notes_enquiry_id ON public.enquiry_notes(enquiry_id);
CREATE INDEX idx_enquiry_notes_created_at ON public.enquiry_notes(created_at DESC);
CREATE INDEX idx_enquiry_notes_note_type ON public.enquiry_notes(note_type);

-- Add comment to table
COMMENT ON TABLE public.enquiry_notes IS 'CRM activity log for enquiries. Tracks notes, calls, emails, and system events.';

-- RLS policies for enquiry_notes
ALTER TABLE public.enquiry_notes ENABLE ROW LEVEL SECURITY;

-- Admin and staff can view all notes
CREATE POLICY "Admin and staff can view all enquiry notes"
  ON public.enquiry_notes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Admin and staff can insert notes
CREATE POLICY "Admin and staff can insert enquiry notes"
  ON public.enquiry_notes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Only note author can delete their own notes (not system-generated ones)
CREATE POLICY "Authors can delete their own non-system notes"
  ON public.enquiry_notes
  FOR DELETE
  USING (
    author_id = auth.uid()
    AND note_type NOT IN ('system', 'status_change', 'quote_created')
  );

-- Create enquiry_quotes table for quote revision tracking
CREATE TABLE IF NOT EXISTS public.enquiry_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id UUID NOT NULL REFERENCES public.enquiries(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  notes TEXT,
  reason_for_change TEXT,
  is_accepted BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_enquiry_version UNIQUE (enquiry_id, version_number)
);

-- Create indexes for enquiry_quotes
CREATE INDEX idx_enquiry_quotes_enquiry_id ON public.enquiry_quotes(enquiry_id);
CREATE INDEX idx_enquiry_quotes_version ON public.enquiry_quotes(enquiry_id, version_number DESC);
CREATE INDEX idx_enquiry_quotes_is_accepted ON public.enquiry_quotes(is_accepted) WHERE is_accepted = true;

-- Add comment to table
COMMENT ON TABLE public.enquiry_quotes IS 'Stores quote revisions for enquiries. Tracks pricing evolution and acceptance.';

-- RLS policies for enquiry_quotes
ALTER TABLE public.enquiry_quotes ENABLE ROW LEVEL SECURITY;

-- Admin and staff can view all quotes
CREATE POLICY "Admin and staff can view all enquiry quotes"
  ON public.enquiry_quotes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Admin and staff can insert quotes
CREATE POLICY "Admin and staff can insert enquiry quotes"
  ON public.enquiry_quotes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Admin and staff can update quotes (for marking as accepted)
CREATE POLICY "Admin and staff can update enquiry quotes"
  ON public.enquiry_quotes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );
