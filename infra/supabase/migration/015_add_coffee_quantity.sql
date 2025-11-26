-- Add percolated_coffee_quantity to meal_jobs
alter table public.meal_jobs
add column if not exists percolated_coffee_quantity int;
