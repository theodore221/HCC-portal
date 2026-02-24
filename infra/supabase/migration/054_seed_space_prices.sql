-- Seed space prices
-- Uses id (primary key) to avoid ambiguity with display names.

UPDATE public.spaces SET price = 1500 WHERE id = 'Whole Centre Day Hire';
UPDATE public.spaces SET price = 700  WHERE id = 'Chapel';
UPDATE public.spaces SET price = 550  WHERE id = 'Chapter';
UPDATE public.spaces SET price = 700  WHERE id = 'Corbett';
UPDATE public.spaces SET price = 700  WHERE id = 'La Velle';
UPDATE public.spaces SET price = 550  WHERE id = 'Morris';
UPDATE public.spaces SET price = 700  WHERE id = 'Dining Hall';
UPDATE public.spaces SET price = 0    WHERE id = 'Outdoor Picnic Space';
