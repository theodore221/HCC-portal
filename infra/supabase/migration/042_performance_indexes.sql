-- Migration: Performance Indexes
-- Creates indexes to optimize common queries

-- Index for booking queries filtered by arrival date
CREATE INDEX IF NOT EXISTS idx_bookings_arrival_date
  ON bookings(arrival_date)
  WHERE status != 'Cancelled';

-- Composite index for status and arrival date (used in list queries)
CREATE INDEX IF NOT EXISTS idx_bookings_status_arrival
  ON bookings(status, arrival_date);

-- Index for booking queries filtered by departure date
CREATE INDEX IF NOT EXISTS idx_bookings_departure_date
  ON bookings(departure_date)
  WHERE status != 'Cancelled';

-- Index for space reservations by booking_id (used frequently in joins)
CREATE INDEX IF NOT EXISTS idx_space_reservations_booking_id
  ON space_reservations(booking_id);

-- Index for space reservations by service_date (used in conflict detection)
CREATE INDEX IF NOT EXISTS idx_space_reservations_service_date
  ON space_reservations(service_date, space_id);

-- Index for meal jobs by booking_id
CREATE INDEX IF NOT EXISTS idx_meal_jobs_booking_id
  ON meal_jobs(booking_id);

-- Index for meal job items by meal_job_id
CREATE INDEX IF NOT EXISTS idx_meal_job_items_meal_job_id
  ON meal_job_items(meal_job_id);

-- Index for room assignments by booking_id
CREATE INDEX IF NOT EXISTS idx_room_assignments_booking_id
  ON room_assignments(booking_id);

-- Index for dietary profiles by booking_id
CREATE INDEX IF NOT EXISTS idx_dietary_profiles_booking_id
  ON dietary_profiles(booking_id);

-- Enable pg_trgm extension for fuzzy text search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram index for fuzzy search on customer_name
CREATE INDEX IF NOT EXISTS idx_bookings_customer_name_trgm
  ON bookings USING gin(customer_name gin_trgm_ops);

-- Trigram index for fuzzy search on customer_email
CREATE INDEX IF NOT EXISTS idx_bookings_customer_email_trgm
  ON bookings USING gin(customer_email gin_trgm_ops);

-- Trigram index for fuzzy search on contact_name
CREATE INDEX IF NOT EXISTS idx_bookings_contact_name_trgm
  ON bookings USING gin(contact_name gin_trgm_ops);

-- Trigram index for fuzzy search on reference
CREATE INDEX IF NOT EXISTS idx_bookings_reference_trgm
  ON bookings USING gin(reference gin_trgm_ops);

-- Add comments for documentation
COMMENT ON INDEX idx_bookings_arrival_date IS
  'Optimizes queries filtering by arrival_date, excluding cancelled bookings';

COMMENT ON INDEX idx_bookings_status_arrival IS
  'Composite index for queries filtering by both status and arrival_date';

COMMENT ON INDEX idx_bookings_customer_name_trgm IS
  'Trigram index enabling fast fuzzy search on customer names';

COMMENT ON INDEX idx_bookings_reference_trgm IS
  'Trigram index enabling fast fuzzy search on booking references';
