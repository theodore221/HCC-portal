-- Migration 073: Re-add InProgress and Completed shift statuses
-- After migration 068 simplified to only 'Published', bring back the
-- operational statuses needed for staff to end shifts and trigger timesheet prompts.

-- ============================================================
-- 1. Drop RLS policies that reference shift_status enum
-- ============================================================
DROP POLICY IF EXISTS staff_assigned_shifts_select ON shifts;
DROP POLICY IF EXISTS staff_end_shift_update ON shifts;

-- ============================================================
-- 2. Recreate shift_status enum with three values
-- ============================================================
-- Rename old enum out of the way
ALTER TYPE shift_status RENAME TO shift_status_old;

-- Create new enum
CREATE TYPE shift_status AS ENUM ('Published', 'InProgress', 'Completed');

-- Migrate the column
ALTER TABLE shifts
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE shift_status
    USING CASE status::text
      WHEN 'Published'  THEN 'Published'::shift_status
      WHEN 'InProgress' THEN 'InProgress'::shift_status
      WHEN 'Completed'  THEN 'Completed'::shift_status
      ELSE 'Published'::shift_status
    END,
  ALTER COLUMN status SET DEFAULT 'Published';

-- Drop old enum
DROP TYPE shift_status_old;

-- ============================================================
-- 3. Auto-complete shifts that are in the past
-- ============================================================
UPDATE shifts
SET status = 'Completed'
WHERE shift_date < CURRENT_DATE
  AND status = 'Published';

-- ============================================================
-- 4. Recreate RLS policies
-- ============================================================

-- Staff can view shifts they are assigned to (all statuses)
CREATE POLICY staff_assigned_shifts_select ON shifts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shift_assignments sa
      WHERE sa.shift_id = shifts.id
        AND sa.staff_profile_id = auth.uid()
        AND sa.status <> 'Declined'
    )
  );

-- Staff can transition their assigned shifts: Published/InProgress → Completed
CREATE POLICY staff_end_shift_update ON shifts
  FOR UPDATE
  TO authenticated
  USING (
    status IN ('Published', 'InProgress')
    AND EXISTS (
      SELECT 1 FROM shift_assignments sa
      WHERE sa.shift_id = shifts.id
        AND sa.staff_profile_id = auth.uid()
        AND sa.status = 'Accepted'
    )
  )
  WITH CHECK (
    status = 'Completed'
  );
