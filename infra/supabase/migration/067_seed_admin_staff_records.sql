-- Migration 067: Seed staff_records for admin-role profiles
--
-- Admin users (e.g. Team Leaders) are stored with role='admin' for access control
-- but need to appear in shift allocation, timesheets, etc.
-- getStaffMembers() now queries role IN ('staff', 'admin'), so admin profiles
-- that lack a staff_records row will show up with no record and no edit button.
-- This migration creates minimal staff_records rows for those profiles.
--
-- Safe to re-run: ON CONFLICT DO NOTHING.

INSERT INTO staff_records (profile_id, active)
SELECT id, true
FROM profiles
WHERE role = 'admin'
  AND id NOT IN (SELECT profile_id FROM staff_records)
ON CONFLICT (profile_id) DO NOTHING;
