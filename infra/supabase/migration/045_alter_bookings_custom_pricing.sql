-- Add custom pricing and enquiry tracking fields to bookings table

-- Add source field to track where booking came from
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'portal'
    CHECK (source IN ('google_form', 'portal', 'admin_created'));

-- Add enquiry linkage
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS enquiry_id UUID REFERENCES public.enquiries(id) ON DELETE SET NULL;

-- Add custom pricing token fields (stored as hash for security)
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS custom_pricing_token_hash TEXT UNIQUE;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS custom_pricing_token_expires_at TIMESTAMPTZ;

-- Add flag to indicate if custom pricing was applied
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS custom_pricing_applied BOOLEAN DEFAULT false;

-- Add notes field for custom pricing rationale
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS custom_pricing_notes TEXT;

-- Add discount percentage field
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC(5,2) DEFAULT 0;

-- Create index on custom_pricing_token_hash for fast validation
CREATE INDEX IF NOT EXISTS idx_bookings_custom_token_hash
  ON public.bookings(custom_pricing_token_hash)
  WHERE custom_pricing_token_hash IS NOT NULL;

-- Create index on enquiry_id for tracking conversions
CREATE INDEX IF NOT EXISTS idx_bookings_enquiry_id
  ON public.bookings(enquiry_id)
  WHERE enquiry_id IS NOT NULL;

-- Create index on source for analytics
CREATE INDEX IF NOT EXISTS idx_bookings_source ON public.bookings(source);

-- Update booking_status enum to include new workflow statuses
-- Note: We need to check if these values already exist before adding them
DO $$
BEGIN
  -- Add new status values if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'pending_admin_review'
    AND enumtypid = 'booking_status'::regtype
  ) THEN
    ALTER TYPE booking_status ADD VALUE 'pending_admin_review';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'with_finance'
    AND enumtypid = 'booking_status'::regtype
  ) THEN
    ALTER TYPE booking_status ADD VALUE 'with_finance';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'quote_sent'
    AND enumtypid = 'booking_status'::regtype
  ) THEN
    ALTER TYPE booking_status ADD VALUE 'quote_sent';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'awaiting_customer_details'
    AND enumtypid = 'booking_status'::regtype
  ) THEN
    ALTER TYPE booking_status ADD VALUE 'awaiting_customer_details';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'active'
    AND enumtypid = 'booking_status'::regtype
  ) THEN
    ALTER TYPE booking_status ADD VALUE 'active';
  END IF;
END $$;

-- Add comments
COMMENT ON COLUMN public.bookings.source IS 'Tracks the origin of the booking: google_form (legacy), portal (new system), or admin_created';
COMMENT ON COLUMN public.bookings.enquiry_id IS 'Links booking to the originating enquiry if it was converted from an enquiry';
COMMENT ON COLUMN public.bookings.custom_pricing_token_hash IS 'SHA-256 hash of the custom pricing token. Used for secure token validation.';
COMMENT ON COLUMN public.bookings.custom_pricing_applied IS 'Indicates whether this booking has custom/discounted pricing applied';
COMMENT ON COLUMN public.bookings.custom_pricing_notes IS 'Admin notes explaining the pricing rationale (e.g., "Parish member discount")';
