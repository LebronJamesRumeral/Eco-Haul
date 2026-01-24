-- Update database schema for new payroll calculation formula
-- Formula: Total Cost = Trips × Price/Unit × Volume (CBM/TON)

-- 1. Update trucks table to store dump box capacity
ALTER TABLE public.trucks 
ADD COLUMN IF NOT EXISTS net_capacity DECIMAL(10,2);

-- Calculate net capacity (95% of capacity) for existing trucks
UPDATE public.trucks 
SET net_capacity = capacity * 0.95
WHERE net_capacity IS NULL;

-- 2. Update payroll_records table with new structure
ALTER TABLE public.payroll_records
DROP COLUMN IF EXISTS distance,
DROP COLUMN IF EXISTS tonnage;

ALTER TABLE public.payroll_records
ADD COLUMN IF NOT EXISTS truck_id BIGINT REFERENCES public.trucks(id),
ADD COLUMN IF NOT EXISTS truck_number TEXT,
ADD COLUMN IF NOT EXISTS price_per_unit DECIMAL(10,2) NOT NULL DEFAULT 281.69,
ADD COLUMN IF NOT EXISTS volume DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS unit_type TEXT DEFAULT 'CBM' CHECK (unit_type IN ('CBM', 'TON'));

-- 3. Update billing_rates table structure (site-specific pricing)
DROP TABLE IF EXISTS public.billing_rates_old;
ALTER TABLE public.billing_rates RENAME TO billing_rates_old;

CREATE TABLE IF NOT EXISTS public.billing_rates (
    id BIGSERIAL PRIMARY KEY,
    site_id BIGINT REFERENCES public.sites(id),
    site_name TEXT,
    price_per_unit DECIMAL(10,2) NOT NULL DEFAULT 281.69,
    unit_type TEXT NOT NULL DEFAULT 'CBM' CHECK (unit_type IN ('CBM', 'TON')),
    reduction_factor DECIMAL(5,4) NOT NULL DEFAULT 0.95,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default rates for existing sites
INSERT INTO public.billing_rates (site_name, price_per_unit, unit_type, reduction_factor)
SELECT name, 281.69, 'CBM', 0.95
FROM public.sites
WHERE status = 'Active'
ON CONFLICT DO NOTHING;

-- 4. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payroll_records_truck_id ON public.payroll_records(truck_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_site_id ON public.payroll_records(site_id);
CREATE INDEX IF NOT EXISTS idx_billing_rates_site_id ON public.billing_rates(site_id);

-- 5. Update RLS policies if needed
ALTER TABLE public.billing_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.billing_rates
    FOR SELECT USING (true);

CREATE POLICY "Enable update for authenticated users" ON public.billing_rates
    FOR UPDATE USING (true);

-- 6. Create a view for easy payroll calculations
CREATE OR REPLACE VIEW public.payroll_summary AS
SELECT 
    pr.id,
    pr.driver_name,
    pr.truck_number,
    pr.site_name,
    pr.date,
    pr.trip_count,
    pr.price_per_unit,
    pr.volume,
    pr.unit_type,
    pr.total_cost,
    (pr.trip_count * pr.price_per_unit * pr.volume) AS calculated_cost,
    CASE 
        WHEN ABS(pr.total_cost - (pr.trip_count * pr.price_per_unit * pr.volume)) < 0.01 
        THEN 'Valid' 
        ELSE 'Mismatch' 
    END AS validation_status
FROM public.payroll_records pr
ORDER BY pr.date DESC, pr.created_at DESC;

-- 7. Add helpful comments
COMMENT ON COLUMN public.payroll_records.volume IS 'Net volume after 5% reduction (capacity × 0.95)';
COMMENT ON COLUMN public.payroll_records.price_per_unit IS 'Price per CBM or TON at time of entry';
COMMENT ON COLUMN public.payroll_records.total_cost IS 'Formula: trip_count × price_per_unit × volume';
COMMENT ON TABLE public.billing_rates IS 'Site-specific pricing rates for CBM/TON calculations';

-- =============================================
-- DATA RESET AND SEED
-- =============================================

-- 8. Clear existing data from affected tables
TRUNCATE TABLE public.payroll_records CASCADE;
TRUNCATE TABLE public.billing_rates CASCADE;

-- 9. Update trucks with proper dump box capacities
-- Sample trucks with realistic dump box volumes (in CBM)
UPDATE public.trucks SET capacity = 21.33, net_capacity = 20.26 WHERE truck_number = 'NLA8898';
UPDATE public.trucks SET capacity = 25.00, net_capacity = 23.75 WHERE truck_number = 'NLA8899';
UPDATE public.trucks SET capacity = 18.50, net_capacity = 17.58 WHERE truck_number = 'NLA8900';
UPDATE public.trucks SET capacity = 22.00, net_capacity = 20.90 WHERE truck_number = 'NLA8901';
UPDATE public.trucks SET capacity = 20.00, net_capacity = 19.00 WHERE truck_number = 'NLA8902';

-- For any trucks not specifically updated, calculate net_capacity
UPDATE public.trucks 
SET net_capacity = capacity * 0.95 
WHERE net_capacity IS NULL;

-- 10. Insert site-specific billing rates
INSERT INTO public.billing_rates (site_id, site_name, price_per_unit, unit_type, reduction_factor) VALUES
    ((SELECT id FROM public.sites WHERE name = 'North Mine' LIMIT 1), 'North Mine', 281.69, 'CBM', 0.95),
    ((SELECT id FROM public.sites WHERE name = 'South Pit' LIMIT 1), 'South Pit', 281.69, 'CBM', 0.95),
    ((SELECT id FROM public.sites WHERE name = 'East Quarry' LIMIT 1), 'East Quarry', 180.00, 'TON', 0.95),
    ((SELECT id FROM public.sites WHERE name = 'West Processing' LIMIT 1), 'West Processing', 200.00, 'CBM', 0.95)
ON CONFLICT DO NOTHING;

-- 11. Insert sample payroll records with new formula
-- Example: 5 trips × ₱281.69/CBM × 20.26 CBM = ₱28,543.37
INSERT INTO public.payroll_records (
    driver_id,
    driver_name,
    truck_id,
    truck_number,
    date,
    trip_count,
    price_per_unit,
    volume,
    unit_type,
    site_id,
    site_name,
    total_cost
) VALUES
    -- Driver 1: Juan Dela Cruz - NLA8898 at North Mine
    (
        (SELECT id FROM public.drivers WHERE name = 'Juan Dela Cruz' LIMIT 1),
        'Juan Dela Cruz',
        (SELECT id FROM public.trucks WHERE truck_number = 'NLA8898' LIMIT 1),
        'NLA8898',
        CURRENT_DATE - INTERVAL '2 days',
        5,
        281.69,
        20.26,
        'CBM',
        (SELECT id FROM public.sites WHERE name = 'North Mine' LIMIT 1),
        'North Mine',
        28543.37  -- 5 × 281.69 × 20.26
    ),
    (
        (SELECT id FROM public.drivers WHERE name = 'Juan Dela Cruz' LIMIT 1),
        'Juan Dela Cruz',
        (SELECT id FROM public.trucks WHERE truck_number = 'NLA8898' LIMIT 1),
        'NLA8898',
        CURRENT_DATE - INTERVAL '1 day',
        7,
        281.69,
        20.26,
        'CBM',
        (SELECT id FROM public.sites WHERE name = 'North Mine' LIMIT 1),
        'North Mine',
        39960.72  -- 7 × 281.69 × 20.26
    ),
    (
        (SELECT id FROM public.drivers WHERE name = 'Juan Dela Cruz' LIMIT 1),
        'Juan Dela Cruz',
        (SELECT id FROM public.trucks WHERE truck_number = 'NLA8898' LIMIT 1),
        'NLA8898',
        CURRENT_DATE,
        6,
        281.69,
        20.26,
        'CBM',
        (SELECT id FROM public.sites WHERE name = 'North Mine' LIMIT 1),
        'North Mine',
        34252.04  -- 6 × 281.69 × 20.26
    ),
    
    -- Driver 2: Maria Santos - NLA8899 at South Pit
    (
        (SELECT id FROM public.drivers WHERE name = 'Maria Santos' LIMIT 1),
        'Maria Santos',
        (SELECT id FROM public.trucks WHERE truck_number = 'NLA8899' LIMIT 1),
        'NLA8899',
        CURRENT_DATE - INTERVAL '2 days',
        4,
        281.69,
        23.75,
        'CBM',
        (SELECT id FROM public.sites WHERE name = 'South Pit' LIMIT 1),
        'South Pit',
        26760.05  -- 4 × 281.69 × 23.75
    ),
    (
        (SELECT id FROM public.drivers WHERE name = 'Maria Santos' LIMIT 1),
        'Maria Santos',
        (SELECT id FROM public.trucks WHERE truck_number = 'NLA8899' LIMIT 1),
        'NLA8899',
        CURRENT_DATE - INTERVAL '1 day',
        6,
        281.69,
        23.75,
        'CBM',
        (SELECT id FROM public.sites WHERE name = 'South Pit' LIMIT 1),
        'South Pit',
        40140.08  -- 6 × 281.69 × 23.75
    ),
    (
        (SELECT id FROM public.drivers WHERE name = 'Maria Santos' LIMIT 1),
        'Maria Santos',
        (SELECT id FROM public.trucks WHERE truck_number = 'NLA8899' LIMIT 1),
        'NLA8899',
        CURRENT_DATE,
        5,
        281.69,
        23.75,
        'CBM',
        (SELECT id FROM public.sites WHERE name = 'South Pit' LIMIT 1),
        'South Pit',
        33450.06  -- 5 × 281.69 × 23.75
    ),
    
    -- Driver 3: Pedro Reyes - NLA8900 at East Quarry (TON pricing)
    (
        (SELECT id FROM public.drivers WHERE name = 'Pedro Reyes' LIMIT 1),
        'Pedro Reyes',
        (SELECT id FROM public.trucks WHERE truck_number = 'NLA8900' LIMIT 1),
        'NLA8900',
        CURRENT_DATE - INTERVAL '2 days',
        8,
        180.00,
        17.58,
        'TON',
        (SELECT id FROM public.sites WHERE name = 'East Quarry' LIMIT 1),
        'East Quarry',
        25315.20  -- 8 × 180.00 × 17.58
    ),
    (
        (SELECT id FROM public.drivers WHERE name = 'Pedro Reyes' LIMIT 1),
        'Pedro Reyes',
        (SELECT id FROM public.trucks WHERE truck_number = 'NLA8900' LIMIT 1),
        'NLA8900',
        CURRENT_DATE - INTERVAL '1 day',
        9,
        180.00,
        17.58,
        'TON',
        (SELECT id FROM public.sites WHERE name = 'East Quarry' LIMIT 1),
        'East Quarry',
        28479.60  -- 9 × 180.00 × 17.58
    ),
    (
        (SELECT id FROM public.drivers WHERE name = 'Pedro Reyes' LIMIT 1),
        'Pedro Reyes',
        (SELECT id FROM public.trucks WHERE truck_number = 'NLA8900' LIMIT 1),
        'NLA8900',
        CURRENT_DATE,
        7,
        180.00,
        17.58,
        'TON',
        (SELECT id FROM public.sites WHERE name = 'East Quarry' LIMIT 1),
        'East Quarry',
        22150.80  -- 7 × 180.00 × 17.58
    ),
    
    -- Driver 4: Ana Garcia - NLA8901 at West Processing
    (
        (SELECT id FROM public.drivers WHERE name = 'Ana Garcia' LIMIT 1),
        'Ana Garcia',
        (SELECT id FROM public.trucks WHERE truck_number = 'NLA8901' LIMIT 1),
        'NLA8901',
        CURRENT_DATE - INTERVAL '1 day',
        3,
        200.00,
        20.90,
        'CBM',
        (SELECT id FROM public.sites WHERE name = 'West Processing' LIMIT 1),
        'West Processing',
        12540.00  -- 3 × 200.00 × 20.90
    ),
    (
        (SELECT id FROM public.drivers WHERE name = 'Ana Garcia' LIMIT 1),
        'Ana Garcia',
        (SELECT id FROM public.trucks WHERE truck_number = 'NLA8901' LIMIT 1),
        'NLA8901',
        CURRENT_DATE,
        4,
        200.00,
        20.90,
        'CBM',
        (SELECT id FROM public.sites WHERE name = 'West Processing' LIMIT 1),
        'West Processing',
        16720.00  -- 4 × 200.00 × 20.90
    );

-- 12. Verify data integrity
-- Check that all payroll records match the formula
DO $$
DECLARE
    mismatch_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO mismatch_count
    FROM public.payroll_records
    WHERE ABS(total_cost - (trip_count * price_per_unit * volume)) > 0.01;
    
    IF mismatch_count > 0 THEN
        RAISE NOTICE 'WARNING: % payroll records have formula mismatches', mismatch_count;
    ELSE
        RAISE NOTICE 'SUCCESS: All payroll records match the formula (Trips × Price × Volume)';
    END IF;
END $$;

-- Display summary
SELECT 
    'Payroll Records' AS table_name,
    COUNT(*) AS total_records,
    SUM(total_cost) AS total_payroll,
    MIN(date) AS earliest_date,
    MAX(date) AS latest_date
FROM public.payroll_records
UNION ALL
SELECT 
    'Sites' AS table_name,
    COUNT(*) AS total_records,
    NULL AS total_payroll,
    NULL AS earliest_date,
    NULL AS latest_date
FROM public.sites
UNION ALL
SELECT 
    'Billing Rates' AS table_name,
    COUNT(*) AS total_records,
    AVG(price_per_unit) AS avg_price,
    NULL AS earliest_date,
    NULL AS latest_date
FROM public.billing_rates;

-- End of migration
SELECT 'Database migration completed successfully!' AS status;
