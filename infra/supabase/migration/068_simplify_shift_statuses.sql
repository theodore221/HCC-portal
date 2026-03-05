-- Migration 068: Remove unused shift statuses
--
-- The rostering module no longer uses InProgress, Completed, Cancelled, or Draft.
-- All shifts are created as 'Published' immediately so staff can respond.
-- This migration collapses all existing rows to 'Published' and rebuilds the enum.
--
-- Postgres cannot ALTER the type of a column that is referenced inside an RLS
-- policy definition. The 'staff_assigned_shifts_select' policy on 'shifts' uses
-- `status = ANY (ARRAY['Published'::shift_status, ...])`, so it must be dropped
-- before the ALTER COLUMN and recreated afterward.

-- Step 1: Migrate any existing rows to Published
UPDATE shifts SET status = 'Published' WHERE status != 'Published';

-- Step 2: Drop the default before changing the column type
--         (the old default is typed to the old enum and cannot auto-cast)
ALTER TABLE shifts ALTER COLUMN status DROP DEFAULT;

-- Step 3: Drop the RLS policy that references the 'status' column
--         so Postgres will allow the column type change below.
DROP POLICY IF EXISTS staff_assigned_shifts_select ON shifts;

-- Step 4: Recreate the enum with only Published
--         (Postgres cannot DROP individual enum values; must recreate the type)
ALTER TYPE shift_status RENAME TO shift_status_old;
CREATE TYPE shift_status AS ENUM ('Published');
ALTER TABLE shifts
  ALTER COLUMN status TYPE shift_status
  USING status::text::shift_status;
DROP TYPE shift_status_old;

-- Step 5: Re-add the default now that the column is the new type
ALTER TABLE shifts ALTER COLUMN status SET DEFAULT 'Published';

-- Step 6: Recreate the staff select policy
--         The status filter now collapses to a simple equality check because
--         'Published' is the only value in the new enum.
CREATE POLICY staff_assigned_shifts_select ON shifts
  FOR SELECT
  TO authenticated
  USING (
    status = 'Published'::shift_status
    AND EXISTS (
      SELECT 1
      FROM shift_assignments sa
      WHERE sa.shift_id = shifts.id
        AND sa.staff_profile_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'staff'
    )
  );
