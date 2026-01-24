-- =====================================================
-- ECO HAUL DASHBOARD - Sample Data Seeding Script
-- Run this after setup-database.sql
-- =====================================================

-- Clear existing data (optional)
TRUNCATE trips, trucks, drivers, compliance_checks, payroll_records, users RESTART IDENTITY CASCADE;

-- Insert Drivers FIRST (so we have driver IDs for users table)
-- trips_today and distance_today will be calculated dynamically
INSERT INTO drivers (name, status, trips_today, distance_today, tracking_enabled) VALUES
('John Reyes', 'On Duty', 0, 0, true),      -- driver_id: 1
('Maria Santos', 'On Duty', 0, 0, true),     -- driver_id: 2
('Carlos Mendoza', 'On Duty', 0, 0, true),   -- driver_id: 3
('Juan Dela Cruz', 'Off Duty', 0, 0, false),  -- driver_id: 4
('Anna Cruz', 'On Duty', 0, 0, true);        -- driver_id: 5

-- Insert Users (Admin and Drivers) with proper driver_id linkage
-- Password: password123 (SHA-256 hashed: ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f)
-- Mapping: driver1@ecohual.com = John Reyes (ID: 1), driver2@ecohual.com = Maria Santos (ID: 2),
--          driver3@ecohual.com = Carlos Mendoza (ID: 3), driver4@ecohual.com = Juan Dela Cruz (ID: 4),
--          driver5@ecohual.com = Anna Cruz (ID: 5)
INSERT INTO users (email, password_hash, role, driver_id) VALUES
('admin@ecohual.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'admin', NULL),
('driver1@ecohual.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'driver', 1),
('driver2@ecohual.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'driver', 2),
('driver3@ecohual.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'driver', 3),
('driver4@ecohual.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'driver', 4),
('driver5@ecohual.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'driver', 5);

-- Insert Trucks (with driver assignments)
INSERT INTO trucks (truck_number, plate_number, capacity, driver_id, driver_name, status) VALUES
('T-001', 'MTR-2024-001', 25, 1, 'John Reyes', 'Active'),
('T-002', 'MTR-2024-002', 30, 3, 'Carlos Mendoza', 'Active'),
('T-003', 'MTR-2024-003', 25, 2, 'Maria Santos', 'Active'),
('T-004', 'MTR-2024-004', 28, 4, 'Juan Dela Cruz', 'Inactive'),
('T-005', 'MTR-2024-005', 30, 5, 'Anna Cruz', 'Active'),
('T-006', 'MTR-2024-006', 25, NULL, NULL, 'Inactive');

-- Update drivers with truck assignments
UPDATE drivers SET truck_id = 1, truck_number = 'T-001' WHERE id = 1;
UPDATE drivers SET truck_id = 3, truck_number = 'T-003' WHERE id = 2;
UPDATE drivers SET truck_id = 2, truck_number = 'T-002' WHERE id = 3;
UPDATE drivers SET truck_id = 4, truck_number = 'T-004' WHERE id = 4;
UPDATE drivers SET truck_id = 5, truck_number = 'T-005' WHERE id = 5;

-- Insert Sample Trips (Today) - Leave commented so today starts at 0
-- INSERT INTO trips (date, truck_id, truck_number, driver_id, driver_name, start_time, end_time, distance, duration, cost) VALUES
-- (CURRENT_DATE, 1, 'T-001', 1, 'John Reyes', '06:00 AM', '08:15 AM', 45.2, '2h 15m', '₱2,260'),
-- (CURRENT_DATE, 3, 'T-003', 2, 'Maria Santos', '06:30 AM', '08:28 AM', 38.7, '1h 58m', '₱1,935'),
-- (CURRENT_DATE, 2, 'T-002', 3, 'Carlos Mendoza', '07:15 AM', '09:57 AM', 52.1, '2h 42m', '₱2,605');

-- Insert Additional Trips for Today (Different times)
-- INSERT INTO trips (date, truck_id, truck_number, driver_id, driver_name, start_time, end_time, distance, duration, cost) VALUES
-- (CURRENT_DATE, 5, 'T-005', 5, 'Anna Cruz', '08:00 AM', '10:05 AM', 41.5, '2h 05m', '₱2,075'),
-- (CURRENT_DATE, 4, 'T-004', 4, 'Juan Dela Cruz', '08:30 AM', '10:22 AM', 36.9, '1h 52m', '₱1,845'),
-- (CURRENT_DATE, 1, 'T-001', 1, 'John Reyes', '10:30 AM', '12:45 PM', 48.3, '2h 15m', '₱2,415'),
-- (CURRENT_DATE, 2, 'T-002', 3, 'Carlos Mendoza', '11:00 AM', '01:20 PM', 42.8, '2h 20m', '₱2,140'),
-- (CURRENT_DATE, 3, 'T-003', 2, 'Maria Santos', '01:45 PM', '03:55 PM', 51.2, '2h 10m', '₱2,560'),
-- (CURRENT_DATE, 5, 'T-005', 5, 'Anna Cruz', '02:00 PM', '04:25 PM', 46.7, '2h 25m', '₱2,335');

-- Insert Historical Trips (Past 7 days for chart data)
-- Each day gets varying trip counts for realistic data
DO $$
DECLARE
  day_offset INTEGER;
  trip_count INTEGER;
  i INTEGER;
BEGIN
  FOR day_offset IN 1..6 LOOP
    trip_count := 3 + (RANDOM() * 5)::INTEGER;
    
    FOR i IN 1..trip_count LOOP
      INSERT INTO trips (date, truck_id, truck_number, driver_id, driver_name, start_time, end_time, distance, duration, cost)
      VALUES (
        CURRENT_DATE - (day_offset || ' days')::INTERVAL,
        1 + (RANDOM() * 4)::INTEGER,
        'T-00' || (1 + (RANDOM() * 5)::INTEGER),
        1 + (RANDOM() * 4)::INTEGER,
        (ARRAY['John Reyes', 'Maria Santos', 'Carlos Mendoza', 'Anna Cruz', 'Juan Dela Cruz'])[1 + (RANDOM() * 4)::INTEGER],
        '06:00 AM',
        '08:00 AM',
        30 + (RANDOM() * 40)::NUMERIC(10,2),
        '2h 00m',
        '₱' || (1500 + (RANDOM() * 1500)::INTEGER)::TEXT
      );
    END LOOP;
  END LOOP;
END $$;

-- Update dashboard statistics
SELECT update_dashboard_stats();

-- Recalculate driver daily stats based on today's trips
SELECT update_driver_daily_stats();

-- Insert Compliance Checks
INSERT INTO compliance_checks (site, truck_id, truck_number, last_check, status, notes) VALUES
('Mining Site A', 1, 'T-001', NOW() - INTERVAL '2 hours', 'Compliant', 'All cleanup procedures followed'),
('Mining Site B', 3, 'T-003', NOW() - INTERVAL '3 hours', 'Compliant', 'Excellent condition'),
('Mining Site C', 2, 'T-002', NOW() - INTERVAL '1 day', 'Compliant', 'Standard cleanup completed'),
('Mining Site A', 5, 'T-005', NOW() - INTERVAL '1 day', 'Needs Review', 'Minor cleanup issues detected'),
('Mining Site D', 4, 'T-004', NOW() - INTERVAL '2 days', 'Compliant', 'Passed inspection'),
('Mining Site B', 6, 'T-006', NOW() - INTERVAL '3 days', 'Needs Review', 'Requires follow-up inspection');

-- Insert Payroll Records
INSERT INTO payroll_records (driver_id, driver_name, date, distance, tonnage, trip_count, total_cost) VALUES
(1, 'John Reyes', CURRENT_DATE - INTERVAL '1 day', 250, 15, 5, 15500),
(2, 'Maria Santos', CURRENT_DATE - INTERVAL '1 day', 180, 12, 4, 11400),
(3, 'Carlos Mendoza', CURRENT_DATE - INTERVAL '2 days', 220, 14, 4, 14200),
(5, 'Anna Cruz', CURRENT_DATE - INTERVAL '2 days', 195, 13, 4, 12350),
(1, 'John Reyes', CURRENT_DATE - INTERVAL '3 days', 275, 16, 5, 16450);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Sample data seeded successfully! Your dashboard is ready to use.';
  RAISE NOTICE '';
  RAISE NOTICE '=== USER-DRIVER ACCOUNT CONNECTIONS ===';
  RAISE NOTICE 'Admin: admin@ecohual.com (no driver link)';
  RAISE NOTICE 'Driver1: driver1@ecohual.com → John Reyes (ID: 1) → Truck T-001 [GPS: ON]';
  RAISE NOTICE 'Driver2: driver2@ecohual.com → Maria Santos (ID: 2) → Truck T-003 [GPS: ON]';
  RAISE NOTICE 'Driver3: driver3@ecohual.com → Carlos Mendoza (ID: 3) → Truck T-002 [GPS: ON]';
  RAISE NOTICE 'Driver4: driver4@ecohual.com → Juan Dela Cruz (ID: 4) → Truck T-004 [GPS: OFF]';
  RAISE NOTICE 'Driver5: driver5@ecohual.com → Anna Cruz (ID: 5) → Truck T-005 [GPS: ON]';
  RAISE NOTICE '';
  RAISE NOTICE '=== GPS TRACKING ===';
  RAISE NOTICE 'GPS tracking is enabled for active drivers. Run setup-gps-tracking.sql to set up GPS tables.';
END $$;

-- Verify user-driver connections
SELECT 
  u.email AS "User Email",
  u.role AS "Role",
  u.driver_id AS "Driver ID",
  d.name AS "Driver Name",
  d.truck_number AS "Assigned Truck",
  d.tracking_enabled AS "GPS Tracking"
FROM users u
LEFT JOIN drivers d ON u.driver_id = d.id
ORDER BY u.id;

-- =====================================================
-- INSERT SAMPLE GPS LOCATION DATA FOR TESTING
-- This simulates driver movements throughout the day
-- =====================================================

-- Driver 1 (John Reyes) - Route A: Mining Site A to Site B
INSERT INTO driver_locations (driver_id, latitude, longitude, accuracy, speed, timestamp) VALUES
(1, 14.5995, 120.9842, 10, 0, CURRENT_TIMESTAMP - INTERVAL '8 hours'),
(1, 14.5998, 120.9845, 8, 15, CURRENT_TIMESTAMP - INTERVAL '7 hours 50 minutes'),
(1, 14.6012, 120.9868, 12, 35, CURRENT_TIMESTAMP - INTERVAL '7 hours 30 minutes'),
(1, 14.6045, 120.9912, 9, 45, CURRENT_TIMESTAMP - INTERVAL '7 hours'),
(1, 14.6089, 120.9967, 11, 50, CURRENT_TIMESTAMP - INTERVAL '6 hours 30 minutes'),
(1, 14.6145, 121.0034, 13, 55, CURRENT_TIMESTAMP - INTERVAL '6 hours'),
(1, 14.6145, 121.0034, 12, 0, CURRENT_TIMESTAMP - INTERVAL '5 hours 30 minutes'), -- Stopped at site
(1, 14.6089, 120.9967, 10, 40, CURRENT_TIMESTAMP - INTERVAL '4 hours'),
(1, 14.6045, 120.9912, 11, 45, CURRENT_TIMESTAMP - INTERVAL '3 hours 30 minutes'),
(1, 14.5995, 120.9842, 9, 15, CURRENT_TIMESTAMP - INTERVAL '2 hours');

-- Driver 2 (Maria Santos) - Route B: Site C circuit
INSERT INTO driver_locations (driver_id, latitude, longitude, accuracy, speed, timestamp) VALUES
(2, 14.6234, 120.9756, 11, 0, CURRENT_TIMESTAMP - INTERVAL '8 hours'),
(2, 14.6267, 120.9801, 9, 25, CURRENT_TIMESTAMP - INTERVAL '7 hours 45 minutes'),
(2, 14.6312, 120.9867, 10, 40, CURRENT_TIMESTAMP - INTERVAL '7 hours 15 minutes'),
(2, 14.6378, 120.9945, 12, 50, CURRENT_TIMESTAMP - INTERVAL '6 hours 45 minutes'),
(2, 14.6445, 121.0034, 8, 55, CURRENT_TIMESTAMP - INTERVAL '6 hours'),
(2, 14.6445, 121.0034, 10, 0, CURRENT_TIMESTAMP - INTERVAL '5 hours'),
(2, 14.6378, 120.9945, 11, 50, CURRENT_TIMESTAMP - INTERVAL '3 hours 45 minutes'),
(2, 14.6234, 120.9756, 9, 35, CURRENT_TIMESTAMP - INTERVAL '2 hours');

-- Driver 3 (Carlos Mendoza) - Route D: Site D and beyond
INSERT INTO driver_locations (driver_id, latitude, longitude, accuracy, speed, timestamp) VALUES
(3, 14.5834, 121.0045, 10, 0, CURRENT_TIMESTAMP - INTERVAL '8 hours'),
(3, 14.5867, 121.0089, 9, 30, CURRENT_TIMESTAMP - INTERVAL '7 hours 40 minutes'),
(3, 14.5923, 121.0156, 11, 45, CURRENT_TIMESTAMP - INTERVAL '7 hours'),
(3, 14.6001, 121.0245, 10, 55, CURRENT_TIMESTAMP - INTERVAL '6 hours 15 minutes'),
(3, 14.6089, 121.0334, 12, 60, CURRENT_TIMESTAMP - INTERVAL '5 hours 30 minutes'),
(3, 14.6089, 121.0334, 11, 0, CURRENT_TIMESTAMP - INTERVAL '4 hours 45 minutes'),
(3, 14.6001, 121.0245, 9, 50, CURRENT_TIMESTAMP - INTERVAL '2 hours 30 minutes'),
(3, 14.5834, 121.0045, 10, 25, CURRENT_TIMESTAMP - INTERVAL '1 hour');

-- Driver 5 (Anna Cruz) - Short route today
INSERT INTO driver_locations (driver_id, latitude, longitude, accuracy, speed, timestamp) VALUES
(5, 14.5712, 120.9634, 10, 0, CURRENT_TIMESTAMP - INTERVAL '4 hours'),
(5, 14.5745, 120.9678, 9, 20, CURRENT_TIMESTAMP - INTERVAL '3 hours 50 minutes'),
(5, 14.5801, 120.9745, 11, 38, CURRENT_TIMESTAMP - INTERVAL '3 hours 15 minutes'),
(5, 14.5878, 120.9834, 10, 42, CURRENT_TIMESTAMP - INTERVAL '2 hours 45 minutes'),
(5, 14.5878, 120.9834, 12, 0, CURRENT_TIMESTAMP - INTERVAL '1 hour 30 minutes'),
(5, 14.5801, 120.9745, 9, 35, CURRENT_TIMESTAMP - INTERVAL '30 minutes');

-- Success notification
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== GPS TEST DATA ===';
  RAISE NOTICE 'Sample GPS locations inserted for drivers 1, 2, 3, and 5';
  RAISE NOTICE 'GPS data is ready for trip auto-generation testing';
  RAISE NOTICE 'Run setup-gps-trips.sql to enable auto-trip generation from GPS data';
END $$;
