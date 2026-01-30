-- =====================================================
-- ECO HAUL DASHBOARD - Database Setup Script
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Create tables (in correct order for foreign keys)
-- 1. Drivers table (no dependencies)
CREATE TABLE IF NOT EXISTS drivers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  truck_id BIGINT,
  truck_number TEXT,
  status TEXT DEFAULT 'Off Duty' CHECK (status IN ('On Duty', 'Off Duty', 'Leave')),
  trips_today INTEGER DEFAULT 0,
  distance_today NUMERIC(10, 2) DEFAULT 0,
  daily_reset_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Trucks table (can reference drivers)
CREATE TABLE IF NOT EXISTS trucks (
  id BIGSERIAL PRIMARY KEY,
  truck_number TEXT UNIQUE NOT NULL,
  plate_number TEXT UNIQUE NOT NULL,
  capacity INTEGER NOT NULL,
  driver_id BIGINT REFERENCES drivers(id),
  driver_name TEXT,
  status TEXT DEFAULT 'Inactive' CHECK (status IN ('Active', 'Inactive', 'Maintenance')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add foreign key from drivers to trucks (after trucks table created)
ALTER TABLE drivers 
DROP CONSTRAINT IF EXISTS fk_drivers_truck_id;

ALTER TABLE drivers 
ADD CONSTRAINT fk_drivers_truck_id 
FOREIGN KEY (truck_id) REFERENCES trucks(id) ON DELETE SET NULL;

-- 4. Users table (references drivers)
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'driver')),
  driver_id BIGINT REFERENCES drivers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trips (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  truck_id BIGINT REFERENCES trucks(id),
  truck_number TEXT NOT NULL,
  driver_id BIGINT REFERENCES drivers(id),
  driver_name TEXT NOT NULL,
  driver_receipt_number TEXT,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  distance NUMERIC(10, 2) NOT NULL,
  duration TEXT NOT NULL,
  cost TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dashboard_stats (
  id INTEGER PRIMARY KEY DEFAULT 1,
  active_trucks INTEGER DEFAULT 0,
  drivers_on_duty INTEGER DEFAULT 0,
  trips_today INTEGER DEFAULT 0,
  total_distance NUMERIC(10, 2) DEFAULT 0,
  payroll_cost NUMERIC(10, 2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

CREATE TABLE IF NOT EXISTS compliance_checks (
  id BIGSERIAL PRIMARY KEY,
  site TEXT NOT NULL,
  truck_id BIGINT REFERENCES trucks(id),
  truck_number TEXT NOT NULL,
  last_check TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'Compliant' CHECK (status IN ('Compliant', 'Needs Review', 'Non-Compliant')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS billing_rates (
  id INTEGER PRIMARY KEY DEFAULT 1,
  rate_per_km NUMERIC(10, 2) DEFAULT 50,
  rate_per_ton NUMERIC(10, 2) DEFAULT 150,
  fixed_trip_cost NUMERIC(10, 2) DEFAULT 100,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

CREATE TABLE IF NOT EXISTS payroll_records (
  id BIGSERIAL PRIMARY KEY,
  driver_id BIGINT REFERENCES drivers(id),
  driver_name TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  distance NUMERIC(10, 2) DEFAULT 0,
  tonnage NUMERIC(10, 2) DEFAULT 0,
  trip_count INTEGER DEFAULT 0,
  total_cost NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
-- Drop any existing unique constraint on (driver_id, date) to allow multiple trips per day
DROP INDEX IF EXISTS idx_trips_driver_date;

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_driver ON users(driver_id);
CREATE INDEX IF NOT EXISTS idx_drivers_daily_reset ON drivers(daily_reset_at);
CREATE INDEX IF NOT EXISTS idx_trips_date ON trips(date);
CREATE INDEX IF NOT EXISTS idx_trips_truck ON trips(truck_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trucks_status ON trucks(status);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_compliance_status ON compliance_checks(status);
CREATE INDEX IF NOT EXISTS idx_payroll_date ON payroll_records(date);
CREATE INDEX IF NOT EXISTS idx_payroll_driver ON payroll_records(driver_id);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;

-- Users table policies
DROP POLICY IF EXISTS "Allow public read access on users" ON users;
CREATE POLICY "Allow public read access on users" ON users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on users" ON users;
CREATE POLICY "Allow public insert on users" ON users FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on users" ON users;
CREATE POLICY "Allow public update on users" ON users FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public delete on users" ON users;
CREATE POLICY "Allow public delete on users" ON users FOR DELETE USING (true);

-- Create policies for public access (adjust based on your auth requirements)
DROP POLICY IF EXISTS "Allow public read access on drivers" ON drivers;
CREATE POLICY "Allow public read access on drivers" ON drivers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on drivers" ON drivers;
CREATE POLICY "Allow public insert on drivers" ON drivers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on drivers" ON drivers;
CREATE POLICY "Allow public update on drivers" ON drivers FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public delete on drivers" ON drivers;
CREATE POLICY "Allow public delete on drivers" ON drivers FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read access on trucks" ON trucks;
CREATE POLICY "Allow public read access on trucks" ON trucks FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on trucks" ON trucks;
CREATE POLICY "Allow public insert on trucks" ON trucks FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on trucks" ON trucks;
CREATE POLICY "Allow public update on trucks" ON trucks FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public delete on trucks" ON trucks;
CREATE POLICY "Allow public delete on trucks" ON trucks FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read access on trips" ON trips;
CREATE POLICY "Allow public read access on trips" ON trips FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on trips" ON trips;
CREATE POLICY "Allow public insert on trips" ON trips FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on trips" ON trips;
CREATE POLICY "Allow public update on trips" ON trips FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public delete on trips" ON trips;
CREATE POLICY "Allow public delete on trips" ON trips FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read access on compliance_checks" ON compliance_checks;
CREATE POLICY "Allow public read access on compliance_checks" ON compliance_checks FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on compliance_checks" ON compliance_checks;
CREATE POLICY "Allow public insert on compliance_checks" ON compliance_checks FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on compliance_checks" ON compliance_checks;
CREATE POLICY "Allow public update on compliance_checks" ON compliance_checks FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public delete on compliance_checks" ON compliance_checks;
CREATE POLICY "Allow public delete on compliance_checks" ON compliance_checks FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read access on billing_rates" ON billing_rates;
CREATE POLICY "Allow public read access on billing_rates" ON billing_rates FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public update on billing_rates" ON billing_rates;
CREATE POLICY "Allow public update on billing_rates" ON billing_rates FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public read access on payroll_records" ON payroll_records;
CREATE POLICY "Allow public read access on payroll_records" ON payroll_records FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on payroll_records" ON payroll_records;
CREATE POLICY "Allow public insert on payroll_records" ON payroll_records FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on payroll_records" ON payroll_records;
CREATE POLICY "Allow public update on payroll_records" ON payroll_records FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public delete on payroll_records" ON payroll_records;
CREATE POLICY "Allow public delete on payroll_records" ON payroll_records FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read access on dashboard_stats" ON dashboard_stats;
CREATE POLICY "Allow public read access on dashboard_stats" ON dashboard_stats FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on dashboard_stats" ON dashboard_stats;
CREATE POLICY "Allow public insert on dashboard_stats" ON dashboard_stats FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on dashboard_stats" ON dashboard_stats;
CREATE POLICY "Allow public update on dashboard_stats" ON dashboard_stats FOR UPDATE USING (true);

-- Function to update dashboard stats
CREATE OR REPLACE FUNCTION update_dashboard_stats()
RETURNS void AS $$
BEGIN
  INSERT INTO dashboard_stats (id, active_trucks, drivers_on_duty, trips_today, total_distance, payroll_cost, updated_at)
  VALUES (
    1,
    (SELECT COUNT(*) FROM trucks WHERE status = 'Active'),
    (SELECT COUNT(*) FROM drivers WHERE status = 'On Duty'),
    (SELECT COUNT(*) FROM trips WHERE date = CURRENT_DATE),
    (SELECT COALESCE(SUM(distance), 0) FROM trips WHERE date = CURRENT_DATE),
    (SELECT COALESCE(SUM(CAST(REPLACE(REPLACE(cost, '₱', ''), ',', '') AS NUMERIC)), 0) FROM trips WHERE date = CURRENT_DATE),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    active_trucks = EXCLUDED.active_trucks,
    drivers_on_duty = EXCLUDED.drivers_on_duty,
    trips_today = EXCLUDED.trips_today,
    total_distance = EXCLUDED.total_distance,
    payroll_cost = EXCLUDED.payroll_cost,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stats when trips change
CREATE OR REPLACE FUNCTION trigger_update_stats()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_dashboard_stats();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_stats_on_trip_change ON trips;
CREATE TRIGGER update_stats_on_trip_change
AFTER INSERT OR UPDATE OR DELETE ON trips
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_update_stats();

-- Initialize billing rates
INSERT INTO billing_rates (id, rate_per_km, rate_per_ton, fixed_trip_cost) 
VALUES (1, 50, 150, 100) ON CONFLICT DO NOTHING;

-- Initialize dashboard stats
INSERT INTO dashboard_stats (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Database setup complete! Now run the seed-data.sql script to populate with sample data.';
END $$;
