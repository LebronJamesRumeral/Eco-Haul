-- Add payroll_cost column to payroll_records table
-- This separates billing cost from driver payroll cost

ALTER TABLE payroll_records 
ADD COLUMN IF NOT EXISTS payroll_cost NUMERIC DEFAULT 0;

-- Update existing records to calculate payroll_cost based on trip_count
-- 1-2 trips: trips × 400
-- 3 trips: trips × 500
-- 4+ trips: trips × 625

UPDATE payroll_records
SET payroll_cost = CASE
  WHEN trip_count <= 2 THEN trip_count * 400
  WHEN trip_count = 3 THEN trip_count * 500
  WHEN trip_count >= 4 THEN trip_count * 625
  ELSE 0
END
WHERE payroll_cost = 0 OR payroll_cost IS NULL;

-- Add comment to clarify the column purpose
COMMENT ON COLUMN payroll_records.payroll_cost IS 'Driver payroll based on trip tiers: 1-2 trips (×400), 3 trips (×500), 4+ trips (×625)';
COMMENT ON COLUMN payroll_records.total_cost IS 'Billing cost: trip_count × price_per_unit × volume';
