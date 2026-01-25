-- =====================================================
-- GPS TRACKING TO TRIPS CONVERSION (Simplified)
-- Automatically calculate trip statistics from GPS data
-- =====================================================

-- Drop existing functions if they exist (to avoid conflicts)
DROP FUNCTION IF EXISTS auto_create_trips_from_gps() CASCADE;
DROP FUNCTION IF EXISTS update_driver_daily_stats() CASCADE;
DROP FUNCTION IF EXISTS process_gps_locations_to_trips() CASCADE;

-- Add trip_id to driver_locations to link GPS data to trips
ALTER TABLE driver_locations ADD COLUMN IF NOT EXISTS trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL;

-- Create function to calculate distance between two GPS points (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(lat1 DECIMAL, lon1 DECIMAL, lat2 DECIMAL, lon2 DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
  R DECIMAL := 6371; -- Earth's radius in kilometers
  dLat DECIMAL;
  dLon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
    RETURN 0;
  END IF;
  
  dLat := (lat2 - lat1) * PI() / 180;
  dLon := (lon2 - lon1) * PI() / 180;
  
  a := SIN(dLat/2) * SIN(dLat/2) + 
       COS(lat1 * PI() / 180) * COS(lat2 * PI() / 180) * 
       SIN(dLon/2) * SIN(dLon/2);
  
  c := 2 * ATAN2(SQRT(a), SQRT(1-a));
  
  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calculate total distance from GPS locations for a driver on a given date
-- Only counts GPS points that occurred after the first trip was created
CREATE OR REPLACE FUNCTION calculate_distance_from_gps(p_driver_id INTEGER, p_date DATE)
RETURNS DECIMAL AS $$
DECLARE
  v_total_distance DECIMAL := 0;
  v_prev_lat DECIMAL;
  v_prev_lon DECIMAL;
  v_curr_lat DECIMAL;
  v_curr_lon DECIMAL;
  v_distance DECIMAL;
  v_trip_start_time TIMESTAMPTZ;
  v_record RECORD;
BEGIN
  v_prev_lat := NULL;
  v_prev_lon := NULL;
  
  -- Get the start time of the first trip for this driver on this date
  SELECT MIN(created_at) INTO v_trip_start_time
  FROM trips
  WHERE driver_id = p_driver_id 
  AND DATE(date) = p_date;
  
  -- If no trip exists, return 0
  IF v_trip_start_time IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Iterate through GPS points in chronological order, only after trip started
  FOR v_record IN 
    SELECT latitude, longitude, timestamp
    FROM driver_locations
    WHERE driver_id = p_driver_id 
    AND DATE(timestamp) = p_date
    AND timestamp >= v_trip_start_time
    ORDER BY timestamp ASC
  LOOP
    v_curr_lat := v_record.latitude;
    v_curr_lon := v_record.longitude;
    
    -- Calculate distance from previous point
    IF v_prev_lat IS NOT NULL AND v_prev_lon IS NOT NULL THEN
      v_distance := calculate_distance(v_prev_lat, v_prev_lon, v_curr_lat, v_curr_lon);
      v_total_distance := v_total_distance + v_distance;
    END IF;
    
    v_prev_lat := v_curr_lat;
    v_prev_lon := v_curr_lon;
  END LOOP;
  
  RETURN ROUND(v_total_distance::NUMERIC, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate trips from GPS location data
CREATE OR REPLACE FUNCTION auto_create_trips_from_gps()
RETURNS TABLE(
  created_count INTEGER,
  message TEXT
) AS $$
DECLARE
  v_driver_id INTEGER;
  v_gps_distance DECIMAL;
  v_trip_count INTEGER;
  v_cost DECIMAL;
  v_created_count INTEGER := 0;
BEGIN
  -- Process each driver with GPS data today
  FOR v_driver_id IN 
    SELECT DISTINCT driver_id 
    FROM driver_locations 
    WHERE DATE(timestamp) = CURRENT_DATE
    ORDER BY driver_id
  LOOP
    -- Calculate distance traveled from GPS locations
    v_gps_distance := calculate_distance_from_gps(v_driver_id, CURRENT_DATE);
    
    -- Only create trip if there's distance recorded
    IF v_gps_distance > 0 THEN
      -- Count number of trip segments (based on GPS point clusters)
      SELECT COUNT(DISTINCT DATE_TRUNC('hour', timestamp)) INTO v_trip_count
      FROM driver_locations
      WHERE driver_id = v_driver_id AND DATE(timestamp) = CURRENT_DATE;
      
      -- Calculate cost at ₱50 per km
      v_cost := v_gps_distance * 50;
      
      -- Create or update trip record for today
      INSERT INTO trips (date, driver_id, driver_name, truck_id, truck_number, distance, cost, start_time, end_time, duration)
      SELECT 
        CURRENT_DATE,
        v_driver_id,
        d.name,
        d.truck_id,
        d.truck_number,
        v_gps_distance,
        v_cost,
        MIN(DATE_TRUNC('hour', dl.timestamp))::TEXT,
        MAX(DATE_TRUNC('hour', dl.timestamp))::TEXT,
        '0h 00m'
      FROM drivers d
      LEFT JOIN driver_locations dl ON d.id = dl.driver_id AND DATE(dl.timestamp) = CURRENT_DATE
      WHERE d.id = v_driver_id
      ON CONFLICT DO NOTHING;
      
      v_created_count := v_created_count + 1;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_created_count, 'Auto-trip generation complete for ' || v_created_count::TEXT || ' drivers';
END;
$$ LANGUAGE plpgsql;

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

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== GPS TO TRIPS CONVERSION FUNCTIONS CREATED ===';
  RAISE NOTICE 'Functions available:';
  RAISE NOTICE '  - calculate_distance(): Haversine formula for GPS coordinates';
  RAISE NOTICE '  - calculate_distance_from_gps(): Sum distance from all GPS points';
  RAISE NOTICE '  - auto_create_trips_from_gps(): Generate trips from GPS data';
  RAISE NOTICE '';
  RAISE NOTICE 'To use:';
  RAISE NOTICE '1. GPS data must be in driver_locations table';
  RAISE NOTICE '2. Call: SELECT auto_create_trips_from_gps();';
  RAISE NOTICE '3. Or call from your app every 5 minutes via RPC';
END $$;
