ALTER TABLE timesheets
  ADD COLUMN completed_task_ids uuid[] NOT NULL DEFAULT '{}';
