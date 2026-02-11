-- Create enquiries table for tracking customer enquiries before booking
CREATE TABLE IF NOT EXISTS public.enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number TEXT UNIQUE NOT NULL,

  -- Customer info
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  organization TEXT,

  -- Event details
  event_type TEXT NOT NULL,
  approximate_start_date DATE,
  approximate_end_date DATE,
  estimated_guests INTEGER,
  message TEXT NOT NULL,

  -- Admin management
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'in_discussion', 'quoted', 'ready_to_book', 'converted_to_booking', 'lost')),
  admin_notes TEXT,
  quoted_amount NUMERIC(10,2),
  lost_reason TEXT,
  converted_to_booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Security metadata
  submitted_from_ip INET,
  submission_duration_seconds INTEGER
);

-- Create index on email for fast customer lookup
CREATE INDEX idx_enquiries_customer_email ON public.enquiries(customer_email);

-- Create index on status for filtering
CREATE INDEX idx_enquiries_status ON public.enquiries(status);

-- Create index on created_at for date range queries
CREATE INDEX idx_enquiries_created_at ON public.enquiries(created_at DESC);

-- Create function to auto-generate reference numbers
CREATE OR REPLACE FUNCTION generate_enquiry_reference()
RETURNS TRIGGER AS $$
DECLARE
  year_suffix TEXT;
  next_number INTEGER;
  new_reference TEXT;
BEGIN
  -- Get current year suffix (e.g., '2026')
  year_suffix := to_char(CURRENT_DATE, 'YYYY');

  -- Get the next sequence number for this year
  SELECT COALESCE(MAX(
    CAST(
      regexp_replace(reference_number, '^ENQ-' || year_suffix || '-', '')
      AS INTEGER
    )
  ), 0) + 1
  INTO next_number
  FROM public.enquiries
  WHERE reference_number LIKE 'ENQ-' || year_suffix || '-%';

  -- Format as ENQ-YYYY-NNNN (e.g., ENQ-2026-0001)
  new_reference := 'ENQ-' || year_suffix || '-' || LPAD(next_number::TEXT, 4, '0');

  NEW.reference_number := new_reference;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate reference on insert
CREATE TRIGGER trigger_generate_enquiry_reference
  BEFORE INSERT ON public.enquiries
  FOR EACH ROW
  WHEN (NEW.reference_number IS NULL)
  EXECUTE FUNCTION generate_enquiry_reference();

-- Create trigger to auto-update updated_at timestamp (uses touch_updated_at from 001_booking_schema.sql)
CREATE TRIGGER trigger_enquiries_updated_at
  BEFORE UPDATE ON public.enquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

-- Add comment to table
COMMENT ON TABLE public.enquiries IS 'Stores customer enquiries before they become bookings. Tracks the lead conversion pipeline.';
