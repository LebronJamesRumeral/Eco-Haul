# Quick Setup Guide

## Step-by-Step Instructions

### 1. Open Supabase SQL Editor

1. Visit: https://app.supabase.com/project/statujyxacahujtumgjs/sql
2. Click "New Query"

### 2. Create Database Structure

Copy **ALL** content from `scripts/setup-database.sql` and paste into the SQL Editor, then click **Run**.

This will create:
- 4 tables (drivers, trucks, trips, dashboard_stats)
- Indexes for performance
- Row Level Security policies
- Auto-update triggers

### 3. Add Sample Data

Copy **ALL** content from `scripts/seed-data.sql` and paste into the SQL Editor, then click **Run**.

This will populate:
- 5 drivers
- 6 trucks
- 20+ trip records
- Dashboard statistics

### 4. Verify Setup

Go to Table Editor in Supabase and you should see:
- **drivers** table with 5 rows
- **trucks** table with 6 rows
- **trips** table with 20+ rows
- **dashboard_stats** table with 1 row

### 5. Start Your App

```bash
npm run dev
```

Visit http://localhost:3000 and you'll see real data from Supabase!

---

## Quick Test Query

Run this in SQL Editor to verify data:

```sql
SELECT 
  COUNT(*) as total_trips,
  SUM(distance) as total_distance,
  COUNT(DISTINCT truck_number) as trucks_used
FROM trips
WHERE date = CURRENT_DATE;
```

You should see results showing today's trips!

---

## Troubleshooting

**Error: relation "drivers" already exists**
- Tables already exist, skip to step 3 (seed data)
- Or delete tables first: `DROP TABLE IF EXISTS trips, trucks, drivers, dashboard_stats CASCADE;`

**No data in tables after seeding**
- Make sure you ran the seed-data.sql script
- Check for error messages in the SQL Editor

**Dashboard shows zeros**
- Run this to manually update stats: `SELECT update_dashboard_stats();`
