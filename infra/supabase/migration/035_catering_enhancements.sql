-- 035_catering_enhancements.sql
-- Adds caterer color, meal job changes_requested flag, and comments table

-- 1. Add color column to caterers table for visual distinction in calendar
ALTER TABLE public.caterers
ADD COLUMN IF NOT EXISTS color text DEFAULT '#3788d8';

-- 2. Add changes_requested flag to meal_jobs for workflow tracking
ALTER TABLE public.meal_jobs
ADD COLUMN IF NOT EXISTS changes_requested boolean NOT NULL DEFAULT false;

-- 3. Create meal_job_comments table for threaded communication between admin and caterer
CREATE TABLE IF NOT EXISTS public.meal_job_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_job_id uuid NOT NULL REFERENCES public.meal_jobs(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_role text NOT NULL CHECK (author_role IN ('admin', 'caterer')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for efficient comment retrieval by meal job
CREATE INDEX IF NOT EXISTS idx_meal_job_comments_job
ON public.meal_job_comments(meal_job_id, created_at);

-- Index for author-based queries
CREATE INDEX IF NOT EXISTS idx_meal_job_comments_author
ON public.meal_job_comments(author_id);

-- 4. Enable RLS on meal_job_comments
ALTER TABLE public.meal_job_comments ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for meal_job_comments

-- Staff (admin/staff) can read all comments
CREATE POLICY "meal_job_comments staff read" ON public.meal_job_comments
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.v_me m WHERE m.role IN ('admin', 'staff'))
);

-- Caterers can read comments on their assigned meal jobs
CREATE POLICY "meal_job_comments caterer read" ON public.meal_job_comments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.v_me m
    JOIN public.meal_jobs mj ON mj.id = meal_job_comments.meal_job_id
    WHERE m.role = 'caterer' AND mj.assigned_caterer_id = m.caterer_id
  )
);

-- Staff can insert comments with any author_role
CREATE POLICY "meal_job_comments staff insert" ON public.meal_job_comments
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.v_me m WHERE m.role IN ('admin', 'staff'))
);

-- Caterers can insert comments on their assigned meal jobs (must be author_role='caterer')
CREATE POLICY "meal_job_comments caterer insert" ON public.meal_job_comments
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.v_me m
    JOIN public.meal_jobs mj ON mj.id = meal_job_comments.meal_job_id
    WHERE m.role = 'caterer'
    AND mj.assigned_caterer_id = m.caterer_id
    AND author_role = 'caterer'
  )
);

-- 6. Add update policy for meal_jobs so caterers can confirm/decline their assigned jobs
CREATE POLICY "meal_jobs caterer update" ON public.meal_jobs
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.v_me m
    WHERE m.role = 'caterer'
    AND m.caterer_id = meal_jobs.assigned_caterer_id
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.v_me m
    WHERE m.role = 'caterer'
    AND m.caterer_id = meal_jobs.assigned_caterer_id
  )
);
