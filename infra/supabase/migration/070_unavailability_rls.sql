-- Migration 070: RLS policies for unavailability tables

-- ============================================================
-- unavailability_periods
-- ============================================================

ALTER TABLE unavailability_periods ENABLE ROW LEVEL SECURITY;

-- Admin: full access (USING + WITH CHECK both required for FOR ALL)
CREATE POLICY "unavailability_periods_admin_all"
  ON unavailability_periods
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Staff: read own
CREATE POLICY "unavailability_periods_staff_select"
  ON unavailability_periods
  FOR SELECT
  TO authenticated
  USING (staff_profile_id = auth.uid());

-- Staff: insert own
CREATE POLICY "unavailability_periods_staff_insert"
  ON unavailability_periods
  FOR INSERT
  TO authenticated
  WITH CHECK (
    staff_profile_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'staff'
    )
  );

-- Staff: update own (date/reason corrections without delete-recreate)
CREATE POLICY "unavailability_periods_staff_update"
  ON unavailability_periods
  FOR UPDATE
  TO authenticated
  USING (staff_profile_id = auth.uid())
  WITH CHECK (staff_profile_id = auth.uid());

-- Staff: delete own
CREATE POLICY "unavailability_periods_staff_delete"
  ON unavailability_periods
  FOR DELETE
  TO authenticated
  USING (staff_profile_id = auth.uid());

-- ============================================================
-- weekly_unavailability
-- ============================================================

ALTER TABLE weekly_unavailability ENABLE ROW LEVEL SECURITY;

-- Admin: full access (USING + WITH CHECK both required for FOR ALL)
CREATE POLICY "weekly_unavailability_admin_all"
  ON weekly_unavailability
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Staff: full CRUD on own rows
CREATE POLICY "weekly_unavailability_staff_select"
  ON weekly_unavailability
  FOR SELECT
  TO authenticated
  USING (staff_profile_id = auth.uid());

CREATE POLICY "weekly_unavailability_staff_insert"
  ON weekly_unavailability
  FOR INSERT
  TO authenticated
  WITH CHECK (
    staff_profile_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'staff'
    )
  );

CREATE POLICY "weekly_unavailability_staff_update"
  ON weekly_unavailability
  FOR UPDATE
  TO authenticated
  USING (staff_profile_id = auth.uid())
  WITH CHECK (staff_profile_id = auth.uid());

CREATE POLICY "weekly_unavailability_staff_delete"
  ON weekly_unavailability
  FOR DELETE
  TO authenticated
  USING (staff_profile_id = auth.uid());
