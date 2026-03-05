-- Migration 063: Rostering RLS Policies
-- Enables RLS and defines per-table policies for admin and staff roles

-- ============================================================
-- STAFF RECORDS
-- ============================================================

ALTER TABLE staff_records ENABLE ROW LEVEL SECURITY;

-- Admin: full access (WITH CHECK mirrors USING for explicit intent)
CREATE POLICY "admin_all_staff_records" ON staff_records
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Staff: view own record only
CREATE POLICY "staff_own_record_select" ON staff_records
  FOR SELECT TO authenticated
  USING (
    profile_id = auth.uid() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'staff')
  );

-- Staff: update own record only
CREATE POLICY "staff_own_record_update" ON staff_records
  FOR UPDATE TO authenticated
  USING (
    profile_id = auth.uid() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'staff')
  )
  WITH CHECK (
    profile_id = auth.uid()
  );

-- ============================================================
-- ROSTER JOBS
-- ============================================================

ALTER TABLE roster_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_roster_jobs" ON roster_jobs
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Staff: read-only (staff only, not admin — admin already covered above)
CREATE POLICY "staff_read_roster_jobs" ON roster_jobs
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'staff')
  );

-- ============================================================
-- ROSTER TASKS
-- ============================================================

ALTER TABLE roster_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_roster_tasks" ON roster_tasks
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Staff: read-only
CREATE POLICY "staff_read_roster_tasks" ON roster_tasks
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'staff')
  );

-- ============================================================
-- SHIFTS
-- ============================================================

ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_shifts" ON shifts
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Staff: view Published/InProgress/Completed shifts they're assigned to
CREATE POLICY "staff_assigned_shifts_select" ON shifts
  FOR SELECT TO authenticated
  USING (
    status IN ('Published', 'InProgress', 'Completed') AND
    EXISTS (
      SELECT 1 FROM shift_assignments sa
      WHERE sa.shift_id = shifts.id
        AND sa.staff_profile_id = auth.uid()
    ) AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'staff')
  );

-- ============================================================
-- SHIFT ASSIGNMENTS
-- ============================================================

ALTER TABLE shift_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_shift_assignments" ON shift_assignments
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Staff: view own assignments
CREATE POLICY "staff_own_assignments_select" ON shift_assignments
  FOR SELECT TO authenticated
  USING (
    staff_profile_id = auth.uid() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'staff')
  );

-- Staff: update own assignment status (accept/decline only — no other columns)
CREATE POLICY "staff_own_assignments_update" ON shift_assignments
  FOR UPDATE TO authenticated
  USING (
    staff_profile_id = auth.uid() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'staff')
  )
  WITH CHECK (
    staff_profile_id = auth.uid() AND
    status IN ('Accepted', 'Declined')
  );

-- ============================================================
-- SHIFT TASKS
-- ============================================================

ALTER TABLE shift_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_shift_tasks" ON shift_tasks
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Staff: view tasks for their assigned shifts
CREATE POLICY "staff_assigned_shift_tasks_select" ON shift_tasks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shift_assignments sa
      WHERE sa.shift_id = shift_tasks.shift_id
        AND sa.staff_profile_id = auth.uid()
    ) AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'staff')
  );

-- ============================================================
-- TIMESHEETS
-- ============================================================

ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_timesheets" ON timesheets
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Staff: view own timesheets
CREATE POLICY "staff_own_timesheets_select" ON timesheets
  FOR SELECT TO authenticated
  USING (
    staff_profile_id = auth.uid() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'staff')
  );

-- Staff: insert own timesheets
CREATE POLICY "staff_own_timesheets_insert" ON timesheets
  FOR INSERT TO authenticated
  WITH CHECK (
    staff_profile_id = auth.uid() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'staff')
  );

-- Staff: update own Draft or Rejected timesheets only.
-- WITH CHECK ensures status can only move to Draft or Submitted (not Approved/Rejected).
CREATE POLICY "staff_own_timesheets_update" ON timesheets
  FOR UPDATE TO authenticated
  USING (
    staff_profile_id = auth.uid() AND
    status IN ('Draft', 'Rejected') AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'staff')
  )
  WITH CHECK (
    staff_profile_id = auth.uid() AND
    status IN ('Draft', 'Submitted')
  );

-- ============================================================
-- LEAVE REQUESTS
-- ============================================================

ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_leave_requests" ON leave_requests
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Staff: view own leave requests
CREATE POLICY "staff_own_leave_select" ON leave_requests
  FOR SELECT TO authenticated
  USING (
    staff_profile_id = auth.uid() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'staff')
  );

-- Staff: insert own leave requests
CREATE POLICY "staff_own_leave_insert" ON leave_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    staff_profile_id = auth.uid() AND
    status = 'Pending' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'staff')
  );

-- Staff: update own Pending leave to Cancelled only
CREATE POLICY "staff_own_leave_update" ON leave_requests
  FOR UPDATE TO authenticated
  USING (
    staff_profile_id = auth.uid() AND
    status = 'Pending' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'staff')
  )
  WITH CHECK (
    staff_profile_id = auth.uid() AND
    status = 'Cancelled'
  );
