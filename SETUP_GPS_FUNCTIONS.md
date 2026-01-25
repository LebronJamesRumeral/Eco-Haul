# 🛠️ GPS Functions Setup Guide

## ⚠️ Important: Deploy SQL Functions to Supabase

The GPS-based trip tracking requires database functions to be deployed. If you see the error:
```
RPC Error: auto_create_trips_from_gps() does not exist
```

Follow these steps:

---

## 📋 Step-by-Step Instructions

### 1. Open Supabase Dashboard
- Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Select your **eco-haul** project

### 2. Navigate to SQL Editor
- Click **SQL Editor** in the left sidebar
- Click **New Query**

### 3. Copy & Paste SQL Script
- Open the file: `scripts/setup-gps-trips.sql`
- Copy ALL contents (lines 1-197)
- Paste into the Supabase SQL Editor

### 4. Execute the Script
- Click **Run** button (or press `Ctrl+Enter`)
- Wait for success message: `Success. No rows returned`

### 5. Verify Functions Created
Run this verification query in SQL Editor:
```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'calculate_distance',
  'calculate_distance_from_gps',
  'auto_create_trips_from_gps',
  'update_driver_daily_stats'
);
```

You should see 4 functions listed.

---

## ✅ What These Functions Do

### 1. `calculate_distance(lat1, lon1, lat2, lon2)`
- Uses **Haversine formula** to calculate distance between two GPS coordinates
- Returns distance in kilometers
- Example: `SELECT calculate_distance(14.5995, 120.9842, 14.6091, 121.0223);` → `5.2 km`

### 2. `calculate_distance_from_gps(driver_id, date)`
- Sums up all GPS point-to-point distances for a driver on a specific date
- Only counts points after trip started
- Returns total distance in km

### 3. `auto_create_trips_from_gps()`
- **Auto-generates trip records** from GPS location data
- Runs every 5 minutes via admin dashboard
- Calculates:
  - Distance from GPS points
  - Cost = Distance × ₱50/km
  - Trip duration from timestamps
- Returns: `{ created_count, message }`

### 4. `update_driver_daily_stats()`
- Updates driver statistics (trips_today, distance_today)
- Useful for dashboard summaries

---

## 🔄 How It Works Together

1. **Driver starts trip** → GPS tracking begins
2. **GPS points recorded** every 10 seconds → Stored in `driver_locations` table with `trip_id`
3. **Driver ends trip** → Client-side calculates distance using Haversine and updates trip
4. **Admin dashboard** → Calls `auto_create_trips_from_gps()` every 5 minutes as backup
5. **Billing page** → Shows GPS earnings: Distance × ₱50/km

---

## 🧪 Testing After Setup

### Test 1: Manual Calculation
```sql
-- Check if GPS points exist
SELECT COUNT(*) FROM driver_locations WHERE DATE(timestamp) = CURRENT_DATE;

-- Calculate distance for driver #1 today
SELECT calculate_distance_from_gps(1, CURRENT_DATE);
```

### Test 2: Auto-Generate Trips
```sql
-- Run the auto-generation function
SELECT * FROM auto_create_trips_from_gps();

-- Check created trips
SELECT id, driver_name, distance, cost, duration FROM trips ORDER BY created_at DESC LIMIT 5;
```

### Test 3: Check in App
- Go to **Admin Dashboard** → Should see "Last GPS sync" timestamp
- Go to **Billing** → Select a driver → Should show GPS distance if available
- Go to **Compliance** → Should show trip verification with GPS data

---

## 🚨 Troubleshooting

### Error: "permission denied for function"
**Solution:** Grant execute permissions:
```sql
GRANT EXECUTE ON FUNCTION calculate_distance TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_distance_from_gps TO authenticated;
GRANT EXECUTE ON FUNCTION auto_create_trips_from_gps TO authenticated;
GRANT EXECUTE ON FUNCTION update_driver_daily_stats TO authenticated;
```

### Error: "column trip_id does not exist"
**Solution:** The script adds this column automatically, but verify:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'driver_locations' AND column_name = 'trip_id';
```

### No GPS data showing
**Checklist:**
- ✅ Driver has started a trip in the app
- ✅ GPS permissions granted in browser
- ✅ GPS points being inserted into `driver_locations` table
- ✅ Trip has been ended (triggers distance calculation)

---

## 📊 Database Schema Reference

### `driver_locations` Table (Updated)
```sql
- id (bigint, primary key)
- driver_id (integer, references drivers.id)
- latitude (decimal)
- longitude (decimal)
- timestamp (timestamptz)
- trip_id (integer, references trips.id) ← NEW COLUMN
```

### `trips` Table
```sql
- id (serial, primary key)
- driver_id (integer)
- driver_name (text)
- distance (decimal) ← Calculated from GPS
- cost (decimal) ← distance × 50
- duration (text)
- start_time (text)
- end_time (text)
- date (date)
```

---

## 🎯 Next Steps After Setup

1. ✅ Run SQL script in Supabase
2. ✅ Verify functions exist
3. ✅ Test with `SELECT auto_create_trips_from_gps();`
4. ✅ Check app: Admin Dashboard should show GPS sync working
5. ✅ Have driver complete a trip to test end-to-end
6. ✅ View GPS earnings in Billing page

---

**Need help?** The error console will now show helpful messages if functions are missing.
