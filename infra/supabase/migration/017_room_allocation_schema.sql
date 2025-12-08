-- Add columns to room_assignments
ALTER TABLE room_assignments 
ADD COLUMN IF NOT EXISTS service_date DATE,
ADD COLUMN IF NOT EXISTS special_requests TEXT;

-- Create rooming_groups table
CREATE TABLE IF NOT EXISTS rooming_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  group_name TEXT NOT NULL,
  members TEXT[] DEFAULT '{}',
  preferred_room_type TEXT,
  special_requests TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE rooming_groups ENABLE ROW LEVEL SECURITY;

-- Create policies for rooming_groups
-- Allow read access to authenticated users
CREATE POLICY "Allow read access for authenticated users" ON rooming_groups
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow insert access to authenticated users
CREATE POLICY "Allow insert access for authenticated users" ON rooming_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow update access to authenticated users
CREATE POLICY "Allow update access for authenticated users" ON rooming_groups
  FOR UPDATE
  TO authenticated
  USING (true);

-- Allow delete access to authenticated users
CREATE POLICY "Allow delete access for authenticated users" ON rooming_groups
  FOR DELETE
  TO authenticated
  USING (true);
