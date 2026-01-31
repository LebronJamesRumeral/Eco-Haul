-- =====================================================
-- Allow NULL values for end_time in trips table
-- This enables active trip tracking (null = trip is active)
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Alter the trips table to allow NULL for end_time
ALTER TABLE trips 
ALTER COLUMN end_time DROP NOT NULL;

-- Update any existing trips where end_time equals start_time to NULL
-- (These were previously marked as active trips)
UPDATE trips 
SET end_time = NULL 
WHERE end_time = start_time;
