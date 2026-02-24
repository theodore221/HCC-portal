-- Add rate_overrides column to bookings for item-level custom pricing
-- This allows admin to set custom rates for specific spaces, accommodation types, and meals
-- when generating custom booking links from enquiries

-- Add the rate_overrides column
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS rate_overrides JSONB DEFAULT NULL;

-- Add comment explaining the structure
COMMENT ON COLUMN public.bookings.rate_overrides IS
'Item-level rate overrides for custom pricing. Structure:
{
  "spaces": {
    "space_id_1": { "original": 700, "override": 595, "name": "Corbett Room" }
  },
  "accommodation": {
    "Single B&B": { "original": 110, "override": 94 },
    "Twin B&B": { "original": 105, "override": 89 }
  },
  "meals": {
    "Lunch": { "original": 24, "override": 20 },
    "Dinner": { "original": 30, "override": 26 }
  }
}';

-- Create index for querying bookings with custom pricing
CREATE INDEX IF NOT EXISTS idx_bookings_rate_overrides
ON public.bookings USING GIN (rate_overrides)
WHERE rate_overrides IS NOT NULL;
