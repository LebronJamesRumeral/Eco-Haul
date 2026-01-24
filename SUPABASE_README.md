# Eco Haul Dashboard - Supabase Integration

This dashboard is now connected to Supabase for real-time data management.

## 🚀 Quick Start

### 1. Database Setup

1. Go to your Supabase project: https://statujyxacahujtumgjs.supabase.co
2. Open the SQL Editor
3. Run the database setup script:
   - Copy and paste the content from `scripts/setup-database.sql`
   - Click "Run" to create all tables, indexes, and policies
4. Run the seed data script:
   - Copy and paste the content from `scripts/seed-data.sql`
   - Click "Run" to populate with sample data

### 2. Install Dependencies (if not already done)

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000 to see your dashboard with live Supabase data!

## 📊 Database Schema

### Tables Created:

- **drivers** - Driver information and daily stats
- **trucks** - Truck fleet management
- **trips** - Trip logs with timestamps and costs
- **dashboard_stats** - Aggregated statistics (auto-updated)

### Automatic Features:

- ✅ Dashboard stats auto-update when trips change
- ✅ Real-time data synchronization
- ✅ Row Level Security (RLS) enabled
- ✅ Optimized indexes for fast queries

## 🔧 Available Hooks

### `useDashboardStats()`
Fetches aggregated dashboard statistics:
- Active trucks count
- Drivers on duty count
- Today's trip count
- Total distance
- Payroll costs

```tsx
const { stats, loading, error } = useDashboardStats()
```

### `useTrips(filters?)`
Fetches trip data with optional filters:

```tsx
const { trips, loading, error } = useTrips({
  date: '2024-01-15',
  truck: 'T-001',
  driver: 'John Reyes'
})
```

### `useTrucks()`
Fetches all trucks:

```tsx
const { trucks, loading, error } = useTrucks()
```

### `useDrivers()`
Fetches all drivers:

```tsx
const { drivers, loading, error } = useDrivers()
```

### `useChartData()`
Fetches data formatted for charts:

```tsx
const { tripsPerDay, distancePerTruck, loading } = useChartData()
```

### `useRealtimeTrips()`
Real-time trip updates (WebSocket):

```tsx
const { trips } = useRealtimeTrips()
```

## 🔐 Security

All tables have Row Level Security (RLS) enabled with public access policies. For production:

1. Implement authentication
2. Update RLS policies to restrict access based on user roles
3. Use service role key for admin operations

## 📝 Adding New Data

You can add data directly in Supabase:

1. Go to Table Editor in Supabase
2. Select the table (trips, trucks, or drivers)
3. Click "Insert row" and fill in the data

Or use the CRUD helper functions in code:

```tsx
import { createTrip, updateTrip, deleteTrip } from '@/hooks/use-supabase-data'

// Create a new trip
await createTrip({
  date: '2024-01-15',
  truck_id: 1,
  truck_number: 'T-001',
  driver_id: 1,
  driver_name: 'John Reyes',
  start_time: '06:00 AM',
  end_time: '08:15 AM',
  distance: 45.2,
  duration: '2h 15m',
  cost: '₱2,250'
})
```

## 🎨 Pages Updated

- ✅ **Dashboard (/)** - Real-time stats, charts, and recent trips
- ✅ **Trips (/trips)** - Complete trip logs from database
- ✅ **Trucks (/trucks)** - Fleet management with live data
- ✅ **Drivers (/drivers)** - Driver roster with daily stats

## 📦 Environment Variables

Your `.env.local` file contains:

```env
NEXT_PUBLIC_SUPABASE_URL=https://statujyxacahujtumgjs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

These are automatically loaded by Next.js (restart dev server after changes).

## 🛠️ Troubleshooting

**"No data showing"**
- Ensure you ran both SQL scripts in Supabase
- Check browser console for errors
- Verify environment variables are set

**"RLS policy violation"**
- Check that RLS policies are created (in setup script)
- Verify you're using the anon key, not service key

**"Data not updating"**
- Hard refresh the page (Ctrl+Shift+R)
- Check Supabase connection status
- Verify API key in .env.local

## 📚 Documentation

- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Recharts Docs](https://recharts.org/)

## 🎯 Next Steps

1. ✅ Database setup complete
2. ✅ Sample data loaded
3. ✅ All pages connected to Supabase
4. 🔜 Add authentication
5. 🔜 Implement create/edit forms
6. 🔜 Add real-time notifications
