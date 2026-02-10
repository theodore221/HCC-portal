-- Create booking_price_snapshots table for pricing audit trail
CREATE TABLE IF NOT EXISTS public.booking_price_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,

  snapshot_type TEXT NOT NULL
    CHECK (snapshot_type IN ('standard', 'custom_link', 'admin_override')),

  -- Pricing data
  line_items JSONB NOT NULL,  -- Array of { category, item, qty, unit_price, total }
  subtotal NUMERIC(10,2) NOT NULL,
  discount_percentage NUMERIC(5,2),
  discount_amount NUMERIC(10,2),
  total NUMERIC(10,2) NOT NULL,

  -- Source prices at time of snapshot
  price_table_snapshot JSONB,  -- { meal_prices: {...}, room_types: {...}, spaces: {...} }

  -- Override details (for admin_override type)
  override_notes TEXT,
  overridden_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index on booking_id for fast lookup
CREATE INDEX idx_booking_price_snapshots_booking_id ON public.booking_price_snapshots(booking_id);

-- Create index on snapshot_type for filtering
CREATE INDEX idx_booking_price_snapshots_type ON public.booking_price_snapshots(snapshot_type);

-- Create index on created_at for chronological ordering
CREATE INDEX idx_booking_price_snapshots_created_at ON public.booking_price_snapshots(created_at DESC);

-- Add comment to table
COMMENT ON TABLE public.booking_price_snapshots IS 'Stores pricing snapshots for bookings, providing a full audit trail of pricing changes. Ensures historical pricing is preserved even when base prices change.';

-- Add comments to important columns
COMMENT ON COLUMN public.booking_price_snapshots.line_items IS 'JSONB array of line items with structure: [{ category: string, item: string, qty: number, unit_price: number, total: number }]';
COMMENT ON COLUMN public.booking_price_snapshots.price_table_snapshot IS 'JSONB snapshot of current prices from meal_prices, room_types, and spaces tables at time of calculation';
COMMENT ON COLUMN public.booking_price_snapshots.snapshot_type IS 'standard: initial pricing from direct booking, custom_link: pre-negotiated pricing, admin_override: post-submission pricing adjustment';
