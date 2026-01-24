-- Migration: Meal Job Aggregations for Performance
-- Creates function to fetch meal jobs with menu items and caterer details in a single query
-- Eliminates N+1 query problem when loading meal jobs

-- Function to get enriched meal jobs for a booking
-- Returns meal jobs with menu item labels and caterer information pre-joined
CREATE OR REPLACE FUNCTION get_meal_jobs_for_booking(p_booking_id uuid)
RETURNS TABLE(
  id uuid,
  booking_id uuid,
  service_date date,
  meal text,
  service_time time,
  headcount integer,
  counts_by_diet jsonb,
  notes text,
  assigned_caterer_id uuid,
  assigned_caterer_name text,
  assigned_caterer_color text,
  menu_item_ids uuid[],
  menu_item_labels text[],
  percolated_coffee boolean,
  changes_requested boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    mj.id,
    mj.booking_id,
    mj.service_date,
    mj.meal,
    mj.service_time,
    mj.headcount,
    mj.counts_by_diet,
    mj.notes,
    mj.assigned_caterer_id,
    c.name as assigned_caterer_name,
    c.color as assigned_caterer_color,
    COALESCE(
      (
        SELECT array_agg(mi.id ORDER BY mi.label)
        FROM meal_job_items mji
        JOIN menu_items mi ON mi.id = mji.menu_item_id
        WHERE mji.meal_job_id = mj.id
      ),
      ARRAY[]::uuid[]
    ) as menu_item_ids,
    COALESCE(
      (
        SELECT array_agg(mi.label ORDER BY mi.label)
        FROM meal_job_items mji
        JOIN menu_items mi ON mi.id = mji.menu_item_id
        WHERE mji.meal_job_id = mj.id
      ),
      ARRAY[]::text[]
    ) as menu_item_labels,
    mj.percolated_coffee,
    mj.changes_requested,
    mj.created_at,
    mj.updated_at
  FROM meal_jobs mj
  LEFT JOIN caterers c ON c.id = mj.assigned_caterer_id
  WHERE mj.booking_id = p_booking_id
  ORDER BY mj.service_date ASC, mj.meal ASC;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_meal_jobs_for_booking(uuid) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_meal_jobs_for_booking(uuid) IS
  'Returns meal jobs for a booking with menu items and caterer details pre-joined. Eliminates N+1 queries.';
