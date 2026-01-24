-- =====================================================
-- VERIFICATION SCRIPT
-- Run this to check if your database is set up correctly
-- =====================================================

-- Check if all tables exist
DO $$
DECLARE
  tables_missing BOOLEAN := FALSE;
BEGIN
  RAISE NOTICE '=== Checking Tables ===';
  
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'drivers') THEN
    RAISE NOTICE '❌ Table "drivers" is missing';
    tables_missing := TRUE;
  ELSE
    RAISE NOTICE '✅ Table "drivers" exists';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'trucks') THEN
    RAISE NOTICE '❌ Table "trucks" is missing';
    tables_missing := TRUE;
  ELSE
    RAISE NOTICE '✅ Table "trucks" exists';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'trips') THEN
    RAISE NOTICE '❌ Table "trips" is missing';
    tables_missing := TRUE;
  ELSE
    RAISE NOTICE '✅ Table "trips" exists';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'dashboard_stats') THEN
    RAISE NOTICE '❌ Table "dashboard_stats" is missing';
    tables_missing := TRUE;
  ELSE
    RAISE NOTICE '✅ Table "dashboard_stats" exists';
  END IF;
  
  IF tables_missing THEN
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Some tables are missing. Please run setup-database.sql';
  END IF;
END $$;

-- Check row counts
DO $$
DECLARE
  driver_count INTEGER;
  truck_count INTEGER;
  trip_count INTEGER;
  stats_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Checking Data ===';
  
  SELECT COUNT(*) INTO driver_count FROM drivers;
  SELECT COUNT(*) INTO truck_count FROM trucks;
  SELECT COUNT(*) INTO trip_count FROM trips;
  SELECT COUNT(*) INTO stats_count FROM dashboard_stats;
  
  RAISE NOTICE 'Drivers: % rows', driver_count;
  RAISE NOTICE 'Trucks: % rows', truck_count;
  RAISE NOTICE 'Trips: % rows', trip_count;
  RAISE NOTICE 'Dashboard Stats: % rows', stats_count;
  
  IF driver_count = 0 OR truck_count = 0 OR trip_count = 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Some tables are empty. Please run seed-data.sql';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '✅ All tables have data!';
  END IF;
END $$;

-- Check dashboard stats values
DO $$
DECLARE
  stats_record RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Dashboard Statistics ===';
  
  SELECT * INTO stats_record FROM dashboard_stats WHERE id = 1;
  
  IF FOUND THEN
    RAISE NOTICE 'Active Trucks: %', stats_record.active_trucks;
    RAISE NOTICE 'Drivers On Duty: %', stats_record.drivers_on_duty;
    RAISE NOTICE 'Trips Today: %', stats_record.trips_today;
    RAISE NOTICE 'Total Distance: % km', stats_record.total_distance;
    RAISE NOTICE 'Payroll Cost: ₱%', stats_record.payroll_cost;
    RAISE NOTICE 'Last Updated: %', stats_record.updated_at;
  ELSE
    RAISE NOTICE '❌ Dashboard stats record not found';
  END IF;
END $$;

-- Sample query to show recent trips
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Recent Trips (Top 5) ===';
END $$;

SELECT 
  date,
  truck_number,
  driver_name,
  distance || ' km' as distance,
  cost
FROM trips
ORDER BY created_at DESC
LIMIT 5;

-- Final status
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Verification Complete ===';
  RAISE NOTICE 'If all checks passed, your database is ready!';
  RAISE NOTICE 'Start your app with: npm run dev';
END $$;
