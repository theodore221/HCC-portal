-- Add cancel_reason column to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancel_reason text;

-- Update Foreign Keys to support Cascade Delete

-- 1. space_reservations
ALTER TABLE space_reservations DROP CONSTRAINT IF EXISTS space_reservations_booking_id_fkey;
ALTER TABLE space_reservations 
    ADD CONSTRAINT space_reservations_booking_id_fkey 
    FOREIGN KEY (booking_id) 
    REFERENCES bookings(id) 
    ON DELETE CASCADE;

-- 2. meal_jobs
ALTER TABLE meal_jobs DROP CONSTRAINT IF EXISTS meal_jobs_booking_id_fkey;
ALTER TABLE meal_jobs 
    ADD CONSTRAINT meal_jobs_booking_id_fkey 
    FOREIGN KEY (booking_id) 
    REFERENCES bookings(id) 
    ON DELETE CASCADE;

-- 3. room_assignments
ALTER TABLE room_assignments DROP CONSTRAINT IF EXISTS room_assignments_booking_id_fkey;
ALTER TABLE room_assignments 
    ADD CONSTRAINT room_assignments_booking_id_fkey 
    FOREIGN KEY (booking_id) 
    REFERENCES bookings(id) 
    ON DELETE CASCADE;

-- 4. rooming_groups
ALTER TABLE rooming_groups DROP CONSTRAINT IF EXISTS rooming_groups_booking_id_fkey;
ALTER TABLE rooming_groups 
    ADD CONSTRAINT rooming_groups_booking_id_fkey 
    FOREIGN KEY (booking_id) 
    REFERENCES bookings(id) 
    ON DELETE CASCADE;

-- 5. dietary_profiles
ALTER TABLE dietary_profiles DROP CONSTRAINT IF EXISTS dietary_profiles_booking_id_fkey;
ALTER TABLE dietary_profiles 
    ADD CONSTRAINT dietary_profiles_booking_id_fkey 
    FOREIGN KEY (booking_id) 
    REFERENCES bookings(id) 
    ON DELETE CASCADE;
