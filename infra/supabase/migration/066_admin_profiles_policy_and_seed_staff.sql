-- Migration 066: Admin profiles policy + seed staff_records
--
-- PROBLEM 1: The profiles table only has "profiles self" (SELECT WHERE auth.uid() = id).
-- This blocks admins from reading other users' profiles, breaking getStaffMembers(),
-- the shift assignment list, timesheet names, leave request names, etc.
--
-- PROBLEM 2: Existing profiles with role='staff' have no staff_records rows,
-- so they don't appear in the Staff tab and can't be assigned to shifts.

-- ============================================================
-- FIX 1: Allow admins to SELECT all profiles
-- ============================================================
-- IMPORTANT: Cannot query 'profiles' inside a profiles policy (infinite recursion).
-- Use a SECURITY DEFINER helper function instead — it runs as superuser, bypassing RLS.

CREATE OR REPLACE FUNCTION auth_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

DROP POLICY IF EXISTS "admin_select_all_profiles" ON profiles;
CREATE POLICY "admin_select_all_profiles" ON profiles
  FOR SELECT TO authenticated
  USING (auth_is_admin());

-- ============================================================
-- FIX 2: Seed staff_records for existing staff-role profiles
-- ============================================================
-- Inserts a minimal staff_records row (active=true, all optional fields NULL)
-- for every profile with role='staff' that doesn't already have one.
-- Safe to re-run: ON CONFLICT DO NOTHING.

INSERT INTO staff_records (profile_id, active)
SELECT id, true
FROM profiles
WHERE role = 'staff'
  AND id NOT IN (SELECT profile_id FROM staff_records)
ON CONFLICT (profile_id) DO NOTHING;
