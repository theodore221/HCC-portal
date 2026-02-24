-- 056_seed_booking_category_room_types.sql
-- Ensure the 4 customer-facing booking category room types exist with correct names and prices.
-- These are the options shown on the /booking/new portal form and stored via accommodation_requests JSONB.
-- Internal per-room allocation types (Single, Twin Single, Queen Bed, etc.) are unchanged.

INSERT INTO public.room_types (name, price, capacity, description) VALUES
  ('Single Bed',                         110.00, 1, 'Single bed accommodation'),
  ('Double Bed',                         149.00, 1, 'Double bed accommodation'),
  ('Double Bed + Ensuite',               199.00, 1, 'Double bed with attached bathroom'),
  ('Double Bed + Ensuite + Priv Study',  250.00, 1, 'Double bed with ensuite and private study room')
ON CONFLICT (name) DO UPDATE SET
  price       = excluded.price,
  capacity    = excluded.capacity,
  description = excluded.description;
