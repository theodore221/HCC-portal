-- ============================================================
-- 077_catering_enhancements.sql
-- Catering module enhancements:
--   • Nullable booking_id on meal_jobs (standalone catering jobs)
--   • group_name column for labeling unlinked jobs
--   • catering_notifications audit table
--   • read_at on meal_job_comments
--   • dietary_labels configurable table
-- ============================================================

-- Make booking_id nullable so admin can create catering jobs before linking to a booking
ALTER TABLE meal_jobs ALTER COLUMN booking_id DROP NOT NULL;

-- Add group_name for labeling unlinked jobs (e.g. "Youth Retreat", "Staff Training")
ALTER TABLE meal_jobs ADD COLUMN IF NOT EXISTS group_name text;

-- Constraint: must have either a booking OR a group name
ALTER TABLE meal_jobs
  ADD CONSTRAINT meal_jobs_booking_or_group_name
  CHECK (booking_id IS NOT NULL OR group_name IS NOT NULL);

-- Notification audit trail for email tracking
CREATE TABLE IF NOT EXISTS catering_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_job_id uuid NOT NULL REFERENCES meal_jobs(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  notification_type text NOT NULL,
  subject text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  resend_message_id text,
  metadata jsonb DEFAULT '{}'
);

-- Index for efficient cascade deletes and lookups by job
CREATE INDEX IF NOT EXISTS idx_catering_notifications_meal_job_id
  ON catering_notifications(meal_job_id);

-- Track unread comments
ALTER TABLE meal_job_comments ADD COLUMN IF NOT EXISTS read_at timestamptz;

-- Configurable dietary labels (admin can add/remove their own)
CREATE TABLE IF NOT EXISTS dietary_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL UNIQUE,
  is_allergy boolean NOT NULL DEFAULT false,  -- true = allergy, false = dietary preference
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed with common defaults (only if table is empty)
INSERT INTO dietary_labels (label, is_allergy, sort_order)
SELECT label, is_allergy, sort_order FROM (VALUES
  ('Vegetarian', false, 1),
  ('Vegan', false, 2),
  ('Gluten Free', true, 3),
  ('Dairy Free', true, 4),
  ('Nut Allergy', true, 5),
  ('Shellfish Allergy', true, 6),
  ('Halal', false, 7),
  ('Kosher', false, 8),
  ('Lactose Intolerant', true, 9),
  ('Coeliac', true, 10)
) AS v(label, is_allergy, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM dietary_labels);

ALTER TABLE dietary_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read dietary labels" ON dietary_labels
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin can insert dietary labels" ON dietary_labels
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can update dietary labels" ON dietary_labels
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can delete dietary labels" ON dietary_labels
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS for notifications
ALTER TABLE catering_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read all notifications" ON catering_notifications
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can insert notifications" ON catering_notifications
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
