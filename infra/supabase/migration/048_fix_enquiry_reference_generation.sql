-- Fix enquiry reference generation by adding SECURITY DEFINER
-- This allows the function to see all enquiries regardless of RLS policies
-- preventing duplicate reference numbers on submission

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
$$ LANGUAGE plpgsql SECURITY DEFINER;
