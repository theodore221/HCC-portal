-- Migration 057: Consolidate booking statuses
--
-- Final 7 statuses:
--   AwaitingDetails, Pending, Approved, Confirmed, InProgress, Completed, Cancelled
--
-- IMPORTANT: Run Part 1 first, then Part 2 in a separate SQL execution.
-- ALTER TYPE ADD VALUE cannot be used in the same transaction as queries that use the new value.

-- ============================================================
-- PART 1 — Run this first, then run Part 2 in a new query
-- ============================================================

ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'AwaitingDetails';

-- ============================================================
-- PART 2 — Run this after Part 1 has been committed
-- ============================================================

-- Migrate deprecated statuses to canonical values
UPDATE public.bookings
SET status = CASE status::text
  WHEN 'pending_admin_review'        THEN 'Pending'
  WHEN 'awaiting_customer_details'   THEN 'AwaitingDetails'
  WHEN 'with_finance'                THEN 'Pending'
  WHEN 'InTriage'                    THEN 'Pending'
  WHEN 'DepositPending'              THEN 'Approved'
  WHEN 'DepositReceived'             THEN 'Confirmed'
  WHEN 'active'                      THEN 'InProgress'
  WHEN 'quote_sent'                  THEN 'Pending'
  ELSE status::text
END::public.booking_status
WHERE status::text IN (
  'pending_admin_review',
  'awaiting_customer_details',
  'with_finance',
  'InTriage',
  'DepositPending',
  'DepositReceived',
  'active',
  'quote_sent'
);

-- Update RLS policies that referenced awaiting_customer_details
DROP POLICY IF EXISTS "Custom token holders can view and update their booking" ON public.bookings;
DROP POLICY IF EXISTS "Custom token holders can update their booking" ON public.bookings;

CREATE POLICY "Custom token holders can view and update their booking"
  ON public.bookings
  FOR SELECT
  TO anon
  USING (
    custom_pricing_token_hash IS NOT NULL
    AND custom_pricing_token_expires_at > now()
    AND status = 'AwaitingDetails'
  );

CREATE POLICY "Custom token holders can update their booking"
  ON public.bookings
  FOR UPDATE
  TO anon
  USING (
    custom_pricing_token_hash IS NOT NULL
    AND custom_pricing_token_expires_at > now()
    AND status = 'AwaitingDetails'
  )
  WITH CHECK (
    custom_pricing_token_hash IS NOT NULL
    AND custom_pricing_token_expires_at > now()
  );
