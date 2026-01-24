# Quick Start: Authentication & Daily Reset

## 🚀 Get Started in 3 Steps

### Step 1: Update Database
In Supabase SQL Editor, run:
```sql
-- Paste entire contents of: scripts/setup-database.sql
```

### Step 2: Seed Data
In Supabase SQL Editor, run:
```sql
-- Paste entire contents of: scripts/seed-data.sql
```

### Step 3: Restart & Test
```bash
npm run dev
```

Then visit: `http://localhost:3000/login`

## 🔐 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ecohual.com | password123 |
| Driver 1 | driver1@ecohual.com | password123 |
| Driver 2 | driver2@ecohual.com | password123 |
| Driver 3 | driver3@ecohual.com | password123 |
| Driver 4 | driver4@ecohual.com | password123 |
| Driver 5 | driver5@ecohual.com | password123 |

## 📊 What Each Role Can Access

### Admin Dashboard (`/`)
- Active trucks count
- Drivers on duty count
- Total trips today
- Total distance traveled
- Payroll costs
- Charts and analytics

### Admin Pages
- `/trucks` - Fleet management
- `/drivers` - Driver roster
- `/trips` - Trip monitoring
- `/compliance` - Compliance tracking
- `/billing` - Billing & payroll
- `/reports` - Historical reports

### Driver Dashboard (`/driver/dashboard`)
- Personal trips today (count)
- Personal distance today (km)
- Personal earnings today (₱)
- Trip history (last 30 days)

### Driver Pages
- `/trips` - Can view all trips (filters to own later)

## ⏰ Daily Reset Feature

**What Happens:**
- Every new day, driver stats reset to 0
- `trips_today` resets
- `distance_today` resets
- Actual trip data drives calculations

**When It Happens:**
- Automatically on page load
- When dashboard is accessed
- When driver list is fetched

**Example:**
- Jan 19: Driver has 5 trips, 125 km
- Jan 20 at 12:01 AM: Dashboard automatically shows 0 trips, 0 km
- Jan 20 after first trip: Shows 1 trip, 45.2 km

## 🔑 Key Files

| File | Purpose |
|------|---------|
| `lib/auth.ts` | Authentication utilities & session management |
| `hooks/use-auth.ts` | useAuth() hook for components |
| `app/login/page.tsx` | Login UI |
| `app/driver/dashboard/page.tsx` | Driver dashboard |
| `hooks/use-supabase-data.ts` | Daily reset logic |

## 🛡️ Security Notes

**Current (Development):**
- SHA-256 password hashing
- localStorage sessions

**⚠️ Production TODO:**
- Switch to bcrypt
- Implement proper session auth
- Use NextAuth.js or Supabase Auth
- Add rate limiting
- Enable HTTPS

## 🐛 Common Issues

**Q: Login page shows but no redirect?**
- A: Check browser console, ensure users table is populated

**Q: Driver sees all trips?**
- A: Check driver_id is set in users table and trips have correct driver_id

**Q: Stats don't reset daily?**
- A: Verify daily_reset_at column exists and trips have today's date

**Q: Can't login as admin?**
- A: Verify role = 'admin' in users table

## 📱 API Reference

### useAuth Hook
```typescript
const { user, loading, logout, isAdmin, isDriver } = useAuth()

// user properties:
user.id          // User ID
user.email       // Email address
user.role        // 'admin' or 'driver'
user.driver_id   // Driver ID (if driver role)
```

### Daily Reset
```typescript
// Automatically called by useDashboardStats() and useDrivers()
// No manual action needed
// Resets when date changes
```

## 🎯 Testing Checklist

- [ ] Login as admin → redirects to `/`
- [ ] Login as driver → redirects to `/driver/dashboard`
- [ ] Bad password → error message
- [ ] Non-existent email → error message
- [ ] Admin can access `/trucks`, `/drivers`, `/compliance`
- [ ] Driver cannot access `/trucks` or `/drivers`
- [ ] Logout clears session & redirects to login
- [ ] Page refresh maintains login session
- [ ] New driver account shows 0 trips, 0 km
- [ ] Adding trip increments trips_today
- [ ] Date change resets stats (or manually verify in DB)

## 💡 Pro Tips

1. **Check session in browser console:**
   ```javascript
   JSON.parse(localStorage.getItem('auth_session'))
   ```

2. **Clear session manually:**
   ```javascript
   localStorage.removeItem('auth_session')
   ```

3. **View hashed passwords:**
   ```javascript
   // Demo password hash
   '9f86d081884c7d6d9ffd60014fc0db77435c18a51fb0285b01be9da059db02181b'
   // This is SHA-256 of 'password123'
   ```

4. **Manual daily reset (if needed):**
   ```sql
   UPDATE drivers SET trips_today = 0, distance_today = 0, daily_reset_at = CURRENT_DATE;
   ```

## 📞 Support

For issues or questions:
1. Check `AUTHENTICATION_SETUP.md` for detailed documentation
2. Review browser console for errors
3. Verify database schema with `setup-database.sql`
4. Check seed data with `seed-data.sql`
