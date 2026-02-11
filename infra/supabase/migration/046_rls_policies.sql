-- Row Level Security Policies for new tables

-- ============================================
-- ENQUIRIES TABLE RLS POLICIES
-- ============================================

-- Enable RLS on enquiries table
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

-- Policy: Public can insert enquiries (rate limited at API layer)
CREATE POLICY "Public can insert enquiries"
  ON public.enquiries
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Authenticated staff/admin can view all enquiries
CREATE POLICY "Staff can view all enquiries"
  ON public.enquiries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Policy: Authenticated staff/admin can update enquiries
CREATE POLICY "Staff can update enquiries"
  ON public.enquiries
  FOR UPDATE
  TO authenticated
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

-- Policy: Authenticated staff/admin can delete enquiries
CREATE POLICY "Staff can delete enquiries"
  ON public.enquiries
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- ============================================
-- BOOKING_PRICE_SNAPSHOTS TABLE RLS POLICIES
-- ============================================

-- Enable RLS on booking_price_snapshots table
ALTER TABLE public.booking_price_snapshots ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated staff/admin can view all price snapshots
CREATE POLICY "Staff can view all price snapshots"
  ON public.booking_price_snapshots
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Policy: Authenticated staff/admin can insert price snapshots
CREATE POLICY "Staff can insert price snapshots"
  ON public.booking_price_snapshots
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Policy: Authenticated staff/admin can update price snapshots
CREATE POLICY "Staff can update price snapshots"
  ON public.booking_price_snapshots
  FOR UPDATE
  TO authenticated
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

-- Policy: Customers with guest tokens can view their own booking price snapshots
-- This uses a custom function to validate guest tokens
CREATE POLICY "Customers can view their booking price snapshots"
  ON public.booking_price_snapshots
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      INNER JOIN public.profiles ON profiles.booking_reference = bookings.reference
      WHERE bookings.id = booking_price_snapshots.booking_id
      AND profiles.guest_token = current_setting('request.jwt.claims', true)::json->>'guest_token'
    )
  );

-- ============================================
-- BOOKINGS TABLE - CUSTOM TOKEN ACCESS
-- ============================================

-- Policy: Allow public access to bookings with valid custom pricing token
-- This allows form submission via custom pricing links
CREATE POLICY "Custom token holders can view and update their booking"
  ON public.bookings
  FOR SELECT
  TO anon
  USING (
    custom_pricing_token_hash IS NOT NULL
    AND custom_pricing_token_expires_at > now()
    AND status = 'awaiting_customer_details'
  );

CREATE POLICY "Custom token holders can update their booking"
  ON public.bookings
  FOR UPDATE
  TO anon
  USING (
    custom_pricing_token_hash IS NOT NULL
    AND custom_pricing_token_expires_at > now()
    AND status = 'awaiting_customer_details'
  )
  WITH CHECK (
    custom_pricing_token_hash IS NOT NULL
    AND custom_pricing_token_expires_at > now()
  );

-- Note: The actual token validation (comparing hash) happens in the API layer
-- These policies just ensure the booking is in the right state for custom token access

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to validate guest tokens (used in customer portal access)
CREATE OR REPLACE FUNCTION public.validate_guest_token(token_value TEXT)
RETURNS TABLE (
  profile_id UUID,
  booking_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as profile_id,
    b.id as booking_id
  FROM public.profiles p
  INNER JOIN public.bookings b ON b.reference = p.booking_reference
  WHERE p.guest_token = token_value
  AND p.role = 'customer';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable pgcrypto extension for digest function (required for hash_token)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to hash custom pricing tokens (for comparison)
CREATE OR REPLACE FUNCTION public.hash_token(token_value TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(token_value, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add comments
COMMENT ON FUNCTION public.validate_guest_token IS 'Validates a guest token and returns the associated profile and booking IDs';
COMMENT ON FUNCTION public.hash_token IS 'Hashes a token value using SHA-256 for secure comparison';
