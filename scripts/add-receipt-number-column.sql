-- =====================================================
-- ECO HAUL DASHBOARD - Add Receipt Number Column
-- Run this in your Supabase SQL Editor to add receipt number validation
-- =====================================================

-- Add driver_receipt_number column to trips table
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS driver_receipt_number TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN trips.driver_receipt_number IS 'Driver receipt number for trip validation - required for trip to be counted';

-- Update existing trips without receipt numbers to have placeholder values
-- Format: RCP-{truck_id}-{sequential_number}
DO $$
DECLARE
  trip_record RECORD;
  counter INTEGER;
BEGIN
  counter := 1;
  FOR trip_record IN 
    SELECT id, truck_id, truck_number 
    FROM trips 
    WHERE driver_receipt_number IS NULL 
    ORDER BY date, id
  LOOP
    UPDATE trips 
    SET driver_receipt_number = 'RCP-' || LPAD(trip_record.truck_id::TEXT, 3, '0') || '-' || LPAD(counter::TEXT, 3, '0')
    WHERE id = trip_record.id;
    counter := counter + 1;
  END LOOP;
  
  RAISE NOTICE 'Updated % trips with receipt numbers', counter - 1;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== RECEIPT NUMBER COLUMN ADDED ===';
  RAISE NOTICE 'The driver_receipt_number column has been added to the trips table.';
  RAISE NOTICE 'Existing trips have been assigned placeholder receipt numbers.';
  RAISE NOTICE 'Format: RCP-{truck_id}-{sequential_number}';
  RAISE NOTICE '';
  RAISE NOTICE 'Trip Validation Rules:';
  RAISE NOTICE '- Trips must have: plate number, date, driver, and receipt number';
  RAISE NOTICE '- Only validated trips will be counted in reports';
END $$;
