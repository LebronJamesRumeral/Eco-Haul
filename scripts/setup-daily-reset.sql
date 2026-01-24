-- =====================================================
-- ECO HAUL DASHBOARD - Daily Reset and Statistics Update
-- This script sets up automatic daily reset for driver statistics
-- =====================================================

-- Function to calculate and update daily driver statistics
CREATE OR REPLACE FUNCTION update_driver_daily_stats()
RETURNS void AS $$
DECLARE
  driver_record RECORD;
  today_trips INTEGER;
  today_distance NUMERIC;
BEGIN
  -- Loop through all drivers
  FOR driver_record IN SELECT id FROM drivers LOOP
    -- Calculate trips for today
    SELECT COUNT(*), COALESCE(SUM(CAST(distance AS NUMERIC)), 0)
    INTO today_trips, today_distance
    FROM trips
    WHERE driver_id = driver_record.id 
    AND date = CURRENT_DATE;
    
    -- Update driver record with today's stats
    UPDATE drivers
    SET trips_today = COALESCE(today_trips, 0),
        distance_today = COALESCE(today_distance, 0)
    WHERE id = driver_record.id;
  END LOOP;
  
  RAISE NOTICE 'Driver daily statistics updated successfully';
END;
$$ LANGUAGE plpgsql;

-- Function to reset driver daily statistics at start of day
CREATE OR REPLACE FUNCTION reset_daily_driver_stats()
RETURNS void AS $$
BEGIN
  -- Reset all driver daily stats to 0
  UPDATE drivers
  SET trips_today = 0,
      distance_today = 0;
  
  RAISE NOTICE 'Driver daily statistics reset successfully';
END;
$$ LANGUAGE plpgsql;

-- Function to recalculate all daily stats (call this every midnight)
CREATE OR REPLACE FUNCTION recalculate_daily_stats()
RETURNS void AS $$
BEGIN
  -- First reset all stats
  PERFORM reset_daily_driver_stats();
  
  -- Then recalculate for today
  PERFORM update_driver_daily_stats();
  
  RAISE NOTICE 'Daily statistics recalculation complete';
END;
$$ LANGUAGE plpgsql;

-- Create a view for real-time driver statistics (alternative to updating columns)
CREATE OR REPLACE VIEW driver_stats_today AS
SELECT 
  d.id,
  d.name,
  d.truck_id,
  d.truck_number,
  d.status,
  d.tracking_enabled,
  COALESCE(COUNT(t.id), 0) AS trips_today_calculated,
  COALESCE(SUM(CAST(t.distance AS NUMERIC)), 0) AS distance_today_calculated,
  COALESCE(SUM(
    CAST(REPLACE(REPLACE(t.cost, '₱', ''), ',', '') AS NUMERIC)
  ), 0) AS earnings_today_calculated
FROM drivers d
LEFT JOIN trips t ON d.id = t.driver_id AND t.date = CURRENT_DATE
GROUP BY d.id, d.name, d.truck_id, d.truck_number, d.status, d.tracking_enabled;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== DAILY RESET FUNCTIONS CREATED ===';
  RAISE NOTICE 'Functions available:';
  RAISE NOTICE '  - update_driver_daily_stats(): Calculate today''s trips and distance';
  RAISE NOTICE '  - reset_daily_driver_stats(): Reset all driver stats to 0';
  RAISE NOTICE '  - recalculate_daily_stats(): Full daily recalculation (call at midnight)';
  RAISE NOTICE '';
  RAISE NOTICE 'View available: driver_stats_today (real-time stats calculation)';
  RAISE NOTICE '';
  RAISE NOTICE 'To apply this setup:';
  RAISE NOTICE '1. Run: SELECT update_driver_daily_stats();';
  RAISE NOTICE '2. Update your dashboard to use the driver_stats_today view';
  RAISE NOTICE '3. Or call update_driver_daily_stats() periodically to refresh stats';
END $$;
