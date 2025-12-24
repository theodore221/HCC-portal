-- Add requested_service_time to meal_jobs for customer time preferences
ALTER TABLE meal_jobs
ADD COLUMN IF NOT EXISTS requested_service_time TEXT DEFAULT NULL;

-- Create dietary_meal_attendance table to track which meals each dietary profile is attending
CREATE TABLE IF NOT EXISTS dietary_meal_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dietary_profile_id UUID NOT NULL REFERENCES dietary_profiles(id) ON DELETE CASCADE,
  meal_job_id UUID NOT NULL REFERENCES meal_jobs(id) ON DELETE CASCADE,
  attending BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(dietary_profile_id, meal_job_id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_dietary_meal_attendance_profile
  ON dietary_meal_attendance(dietary_profile_id);
CREATE INDEX IF NOT EXISTS idx_dietary_meal_attendance_meal
  ON dietary_meal_attendance(meal_job_id);

-- Enable RLS
ALTER TABLE dietary_meal_attendance ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view dietary_meal_attendance for their bookings"
  ON dietary_meal_attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dietary_profiles dp
      JOIN bookings b ON b.id = dp.booking_id
      WHERE dp.id = dietary_meal_attendance.dietary_profile_id
      AND (
        b.customer_user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
          AND p.role IN ('admin', 'staff')
        )
      )
    )
  );

CREATE POLICY "Admins and staff can manage dietary_meal_attendance"
  ON dietary_meal_attendance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Customers can manage their own dietary_meal_attendance"
  ON dietary_meal_attendance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM dietary_profiles dp
      JOIN bookings b ON b.id = dp.booking_id
      WHERE dp.id = dietary_meal_attendance.dietary_profile_id
      AND b.customer_user_id = auth.uid()
    )
  );
