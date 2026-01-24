-- =====================================================
-- ECO HAUL DASHBOARD - GPS Tracking Setup
-- Run this after setup-database.sql
-- =====================================================

-- Add tracking_enabled column to drivers table
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS tracking_enabled BOOLEAN DEFAULT true;

-- Create driver_locations table for GPS tracking
CREATE TABLE IF NOT EXISTS driver_locations (
  id SERIAL PRIMARY KEY,
  driver_id INTEGER NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(10, 2), -- GPS accuracy in meters
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  speed DECIMAL(10, 2), -- Speed in km/h (optional)
  heading DECIMAL(5, 2), -- Direction in degrees (optional)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_driver_locations_driver_id ON driver_locations(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_locations_timestamp ON driver_locations(timestamp);

-- Create view for latest driver locations
CREATE OR REPLACE VIEW latest_driver_locations AS
SELECT DISTINCT ON (dl.driver_id)
  dl.id,
  dl.driver_id,
  d.name AS driver_name,
  d.truck_number,
  d.status AS driver_status,
  d.tracking_enabled,
  dl.latitude,
  dl.longitude,
  dl.accuracy,
  dl.speed,
  dl.heading,
  dl.timestamp,
  EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - dl.timestamp)) AS seconds_since_update
FROM driver_locations dl
JOIN drivers d ON dl.driver_id = d.id
ORDER BY dl.driver_id, dl.timestamp DESC;

-- Function to clean up old location data (keep last 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_locations()
RETURNS void AS $$
BEGIN
  DELETE FROM driver_locations
  WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'GPS tracking tables and views created successfully!';
  RAISE NOTICE 'Drivers can now be tracked via the Geolocation API.';
  RAISE NOTICE 'Admin can view all driver locations in real-time.';
END $$;
