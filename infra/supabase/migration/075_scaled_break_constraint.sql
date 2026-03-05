-- Migration 075: Scaled break constraint
-- Replaces the static 30-min-for-5hr-shifts rule with a scaled rule:
-- 30 min per 5-hour tier (0–4:59 = none, 5–9:59 = 30m, 10–14:59 = 60m, 15+ = 90m)
--
-- Formula: required_break_minutes = FLOOR(gross_minutes / 300) * 30
-- Where:   gross_minutes = EXTRACT(EPOCH FROM (work_end - work_start)) / 60
--          gross_seconds / 18000 = gross_minutes / 300

-- ============================================================
-- STEP 1: Fix existing rows that violate the new scaled rule.
-- These were entered under the old static 30-min rule. For each
-- violating row we extend break_end so that break duration meets
-- the required tier minimum, keeping break_start unchanged.
-- ============================================================

UPDATE timesheets
SET break_end = (
  break_start + make_interval(
    mins => (FLOOR(EXTRACT(EPOCH FROM (work_end - work_start)) / 18000) * 30)::int
  )
)
WHERE
  -- Shift is 5+ hours (needs a break)
  EXTRACT(EPOCH FROM (work_end - work_start)) >= 18000
  AND (
    -- No break recorded at all
    break_start IS NULL
    OR
    -- Break is shorter than required for this tier
    EXTRACT(EPOCH FROM (break_end - break_start)) / 60 <
      FLOOR(EXTRACT(EPOCH FROM (work_end - work_start)) / 18000) * 30
  );

-- ============================================================
-- STEP 2: Drop the old static constraint
-- ============================================================

ALTER TABLE timesheets DROP CONSTRAINT IF EXISTS timesheets_mandatory_break;

-- ============================================================
-- STEP 3: Add the new scaled constraint
-- ============================================================

ALTER TABLE timesheets ADD CONSTRAINT timesheets_scaled_break CHECK (
  -- If gross work < 5 hours, no break required
  EXTRACT(EPOCH FROM (work_end - work_start)) < 18000
  OR
  -- Otherwise, break duration must meet the scaled requirement
  (
    break_start IS NOT NULL
    AND break_end IS NOT NULL
    AND EXTRACT(EPOCH FROM (break_end - break_start)) / 60 >=
        FLOOR(EXTRACT(EPOCH FROM (work_end - work_start)) / 18000) * 30
  )
);
