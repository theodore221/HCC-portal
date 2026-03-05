-- Migration 062: Rostering / Shift Management Schema
-- Creates enums, tables, and triggers for the rostering module

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE shift_status AS ENUM ('Draft', 'Published', 'InProgress', 'Completed', 'Cancelled');
CREATE TYPE assignment_status AS ENUM ('Pending', 'Accepted', 'Declined', 'NoResponse');
CREATE TYPE timesheet_status AS ENUM ('Draft', 'Submitted', 'Approved', 'Rejected');
CREATE TYPE leave_status AS ENUM ('Pending', 'Approved', 'Declined', 'Cancelled');
CREATE TYPE leave_type AS ENUM ('Annual', 'Sick', 'Personal', 'Unpaid', 'Other');

-- ============================================================
-- STAFF RECORDS (extended info, 1:1 with profiles)
-- ============================================================

CREATE TABLE staff_records (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id       uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  phone            text,
  emergency_contact_name  text,
  emergency_contact_phone text,
  position         text,
  notes            text,
  active           boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_staff_records_profile_id ON staff_records(profile_id);
CREATE INDEX idx_staff_records_active ON staff_records(active) WHERE active = true;

-- ============================================================
-- ROSTER JOBS (job categories, e.g. "Toilets + Bathrooms")
-- ============================================================

CREATE TABLE roster_jobs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  description  text,
  color        text NOT NULL DEFAULT '#6c8f36'
                    CHECK (color ~* '^#[0-9a-f]{3}([0-9a-f]{3})?$'),
  active       boolean NOT NULL DEFAULT true,
  sort_order   integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_roster_jobs_active ON roster_jobs(active, sort_order);

-- ============================================================
-- ROSTER TASKS (sub-tasks within jobs)
-- ============================================================

CREATE TABLE roster_tasks (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roster_job_id      uuid NOT NULL REFERENCES roster_jobs(id) ON DELETE CASCADE,
  name               text NOT NULL,
  description        text,
  estimated_minutes  integer,
  sort_order         integer NOT NULL DEFAULT 0,
  active             boolean NOT NULL DEFAULT true,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_roster_tasks_job_id ON roster_tasks(roster_job_id, sort_order);

-- ============================================================
-- SHIFTS (shift instances on calendar)
-- ============================================================

CREATE TABLE shifts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  shift_date   date NOT NULL,
  start_time   time NOT NULL,
  end_time     time NOT NULL,
  notes        text,
  status       shift_status NOT NULL DEFAULT 'Draft',
  created_by   uuid NOT NULL REFERENCES profiles(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT shifts_end_after_start CHECK (end_time > start_time)
);

CREATE INDEX idx_shifts_date ON shifts(shift_date);
CREATE INDEX idx_shifts_status ON shifts(status);
CREATE INDEX idx_shifts_date_status ON shifts(shift_date, status);

-- ============================================================
-- SHIFT ASSIGNMENTS (staff assigned to shifts)
-- ============================================================

CREATE TABLE shift_assignments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id         uuid NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  staff_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status           assignment_status NOT NULL DEFAULT 'Pending',
  responded_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  UNIQUE (shift_id, staff_profile_id)
);

CREATE INDEX idx_shift_assignments_shift_id ON shift_assignments(shift_id);
CREATE INDEX idx_shift_assignments_staff_id ON shift_assignments(staff_profile_id);

-- ============================================================
-- SHIFT TASKS (tasks assigned to a shift)
-- ============================================================

CREATE TABLE shift_tasks (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id       uuid NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  roster_task_id uuid NOT NULL REFERENCES roster_tasks(id) ON DELETE CASCADE,
  sort_order     integer NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),

  UNIQUE (shift_id, roster_task_id)
);

CREATE INDEX idx_shift_tasks_shift_id ON shift_tasks(shift_id, sort_order);

-- ============================================================
-- TIMESHEETS
-- Break rule: 30-min break mandatory for 5+ hour shifts
-- ============================================================

CREATE TABLE timesheets (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  work_date        date NOT NULL,
  work_start       time NOT NULL,
  work_end         time NOT NULL,
  break_start      time,
  break_end        time,
  status           timesheet_status NOT NULL DEFAULT 'Draft',
  shift_id         uuid REFERENCES shifts(id) ON DELETE SET NULL,
  reviewed_by      uuid REFERENCES profiles(id),
  rejection_reason text,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  UNIQUE (staff_profile_id, work_date),

  -- Basic time constraints
  CONSTRAINT timesheets_end_after_start CHECK (work_end > work_start),
  -- Break times must be paired
  CONSTRAINT timesheets_break_paired CHECK (
    (break_start IS NULL AND break_end IS NULL) OR
    (break_start IS NOT NULL AND break_end IS NOT NULL)
  ),
  -- Break must be within work hours
  CONSTRAINT timesheets_break_within_work CHECK (
    break_start IS NULL OR (
      break_start >= work_start AND
      break_end <= work_end AND
      break_end > break_start
    )
  ),
  -- Mandatory 30-min break for 5+ hour shifts
  CONSTRAINT timesheets_mandatory_break CHECK (
    -- If work duration < 5 hours, no break required
    (work_end - work_start) < interval '5 hours' OR
    -- If 5+ hours, break must exist and be at least 30 minutes
    (
      break_start IS NOT NULL AND
      break_end IS NOT NULL AND
      (break_end - break_start) >= interval '30 minutes'
    )
  )
);

CREATE INDEX idx_timesheets_staff_id ON timesheets(staff_profile_id);
CREATE INDEX idx_timesheets_work_date ON timesheets(work_date);
CREATE INDEX idx_timesheets_status ON timesheets(status);
CREATE INDEX idx_timesheets_staff_date ON timesheets(staff_profile_id, work_date);

-- ============================================================
-- LEAVE REQUESTS
-- ============================================================

CREATE TABLE leave_requests (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  leave_type       leave_type NOT NULL,
  start_date       date NOT NULL,
  end_date         date NOT NULL,
  reason           text,
  status           leave_status NOT NULL DEFAULT 'Pending',
  reviewed_by      uuid REFERENCES profiles(id),
  admin_notes      text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT leave_requests_end_after_start CHECK (end_date >= start_date)
);

CREATE INDEX idx_leave_requests_staff_id ON leave_requests(staff_profile_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX idx_leave_requests_staff_status ON leave_requests(staff_profile_id, status);
CREATE INDEX idx_timesheets_staff_status ON timesheets(staff_profile_id, status);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

-- Create the trigger function only if it doesn't already exist.
-- Pin search_path to prevent search-path injection attacks.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Apply to all mutable rostering tables (idempotent: DROP IF EXISTS first)
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'staff_records', 'roster_jobs', 'roster_tasks',
    'shifts', 'shift_assignments', 'timesheets', 'leave_requests'
  ]
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
