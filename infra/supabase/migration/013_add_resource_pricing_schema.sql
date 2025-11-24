-- 013_add_resource_pricing_schema.sql
-- Modified to only add enums to avoid transaction issues (55P04) with new values.
-- The rest of the schema is in 014_add_resource_pricing_tables.sql

-- 1. Update Enums
alter type public.meal_type add value if not exists 'Dessert';
alter type public.meal_type add value if not exists 'Supper';
