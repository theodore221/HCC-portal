-- Enable RLS on meal_job_items
ALTER TABLE meal_job_items ENABLE ROW LEVEL SECURITY;

-- Policy for selecting items (viewing)
CREATE POLICY "Enable read access for authenticated users" ON meal_job_items
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy for inserting items
CREATE POLICY "Enable insert access for authenticated users" ON meal_job_items
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy for deleting items
CREATE POLICY "Enable delete access for authenticated users" ON meal_job_items
    FOR DELETE
    TO authenticated
    USING (true);
