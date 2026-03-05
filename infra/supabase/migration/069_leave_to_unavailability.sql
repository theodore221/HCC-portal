-- Migration 069: Convert Leave system to Unavailability system
-- Replaces leave_requests (with approval workflow) with:
--   1. unavailability_periods  (date-range blocks, instant self-service)
--   2. weekly_unavailability   (recurring weekly schedule, normalized rows)

-- ============================================================
-- 1. DROP OLD LEAVE TABLE + ENUMS
-- ============================================================

DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TYPE IF EXISTS leave_status CASCADE;
DROP TYPE IF EXISTS leave_type CASCADE;

-- ============================================================
-- 2. CREATE unavailability_periods
-- ============================================================

CREATE TABLE IF NOT EXISTS unavailability_periods (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_date       date NOT NULL,
  end_date         date NOT NULL,
  reason           text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT unavailability_periods_end_after_start CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_unavailability_periods_staff_id ON unavailability_periods(staff_profile_id);
CREATE INDEX IF NOT EXISTS idx_unavailability_periods_dates ON unavailability_periods(start_date, end_date);

-- ============================================================
-- 3. CREATE day_of_week ENUM (idempotent)
-- ============================================================

DO $$ BEGIN
  CREATE TYPE day_of_week AS ENUM ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 4. CREATE weekly_unavailability
-- ============================================================

CREATE TABLE IF NOT EXISTS weekly_unavailability (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week      day_of_week NOT NULL,
  start_time       time NOT NULL,
  end_time         time NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT weekly_unavailability_end_after_start CHECK (end_time > start_time),
  UNIQUE (staff_profile_id, day_of_week, start_time, end_time)
);

CREATE INDEX IF NOT EXISTS idx_weekly_unavailability_staff_id ON weekly_unavailability(staff_profile_id, day_of_week);

-- ============================================================
-- 5. UPDATED_AT TRIGGERS
-- ============================================================

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['unavailability_periods', 'weekly_unavailability']
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%s_updated_at ON %I;
       CREATE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      t, t, t, t
    );
  END LOOP;
END;
$$;
