-- Migration 059: Itemized quote support
-- Adds structured pricing data columns to enquiry_quotes and discount_config to bookings

-- Enquiry quotes: store full pricing breakdown from the quote builder
ALTER TABLE public.enquiry_quotes
  ADD COLUMN IF NOT EXISTS selections    JSONB,
  ADD COLUMN IF NOT EXISTS line_items    JSONB,
  ADD COLUMN IF NOT EXISTS discount_config JSONB,
  ADD COLUMN IF NOT EXISTS price_snapshot  JSONB;

-- Bookings: store full discount config (replaces flat discount_percentage for new bookings)
-- Backward compatible: old bookings keep NULL and continue using discount_percentage
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS discount_config JSONB;

-- Index for fast lookup of quotes with itemized data
CREATE INDEX IF NOT EXISTS idx_enquiry_quotes_has_line_items
  ON public.enquiry_quotes ((line_items IS NOT NULL));

COMMENT ON COLUMN public.enquiry_quotes.selections IS
  'BookingSelections JSON — rooms, venue, meals selected at quote time';
COMMENT ON COLUMN public.enquiry_quotes.line_items IS
  'PricingLineItem[] JSON — itemized breakdown stored at quote time';
COMMENT ON COLUMN public.enquiry_quotes.discount_config IS
  'DiscountConfig JSON — per-item overrides and/or percentage discount applied';
COMMENT ON COLUMN public.enquiry_quotes.price_snapshot IS
  'PriceTableSnapshot JSON — base prices from DB at time of calculation';
COMMENT ON COLUMN public.bookings.discount_config IS
  'DiscountConfig JSON — carries through from accepted quote; supersedes discount_percentage when present';
