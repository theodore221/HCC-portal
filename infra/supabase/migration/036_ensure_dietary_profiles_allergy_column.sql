-- Ensure allergy column exists in dietary_profiles table
-- This fixes the schema cache issue where the column might not exist

ALTER TABLE public.dietary_profiles
ADD COLUMN IF NOT EXISTS allergy TEXT;

-- Comment to document the column
COMMENT ON COLUMN public.dietary_profiles.allergy IS 'Details about specific allergies or allergens';
