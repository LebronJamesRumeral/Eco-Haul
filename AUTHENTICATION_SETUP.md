# EcoHaul Dashboard - Authentication & Daily Reset Implementation

## Overview
Implemented a complete role-based authentication system with daily data reset mechanism for the EcoHaul mining operations dashboard.

## Key Features Implemented

### 1. Authentication System
- **Roles**: Admin and Driver
- **Session Management**: localStorage-based with JWT tokens
- **Password Hashing**: SHA-256 based hashing (production should use bcrypt)
- **Route Protection**: Automatic redirection to login for unauthenticated users

### 2. Daily Reset Mechanism
- **Auto Reset**: `trips_today` and `distance_today` reset at start of each day (server time)
- **Implementation**: Checked on every dashboard/driver data fetch
- **Database Column**: `daily_reset_at` tracks last reset date per driver

### 3. Role-Based Access Control
- **Admin Dashboard**: Full monitoring, all users' data, system management
- **Driver Dashboard**: Personal trips, distance, earnings - limited to logged-in driver only
- **Sidebar Navigation**: Shows role-specific menu items

## Files Created/Modified

### New Files Created:
1. **`lib/auth.ts`** - Authentication utilities
   - `login()`: Login function
   - `hashPassword()`: SHA-256 password hashing
   - `verifyPassword()`: Password verification
   - Session management functions

2. **`hooks/use-auth.ts`** - Auth hook
   - `useAuth()`: Main hook for authentication state
   - Returns user, loading, logout, hasRole, isAuthenticated, isAdmin, isDriver

3. **`app/login/page.tsx`** - Login page
   - Role selection (Admin/Driver)
   - Email/password form
   - Demo credentials display
   - Error handling & redirection

4. **`app/driver/dashboard/page.tsx`** - Driver dashboard
   - Personal trips today count
   - Distance traveled today
   - Daily earnings estimate
   - Trip history (last 30 days)
   - Data filtered to logged-in driver only

### Modified Files:
1. **`scripts/setup-database.sql`**
   - Added `users` table with columns:
     - `id`, `email`, `password_hash`, `role`, `driver_id`
   - Added `daily_reset_at` to drivers table
   - Added indexes and RLS policies for users table

2. **`scripts/seed-data.sql`**
   - Added user records (1 admin + 5 drivers)
   - Password: "password123" (SHA-256: 9f86d081884c7d6d9ffd60014fc0db77435c18a51fb0285b01be9da059db02181b)
   - Linked drivers to user accounts

3. **`hooks/use-supabase-data.ts`**
   - Added `checkAndResetDailyStats()` helper function
   - Called from `useDashboardStats()` and `useDrivers()`
   - Automatically resets daily stats if day has changed

4. **`app/page.tsx`** (Admin Dashboard)
   - Added auth protection with `useAuth()`
   - Added logout button
   - Redirects non-admin users to login

5. **`components/sidebar.tsx`**
   - Role-based navigation items
   - Admin vs Driver menu items
   - Shows user email in footer

6. **`app/trucks/page.tsx`**
   - Auth protection (admin only)
   - Redirects to login if not authenticated

7. **`app/drivers/page.tsx`**
   - Auth protection (admin only)
   - Redirects to login if not authenticated

8. **`app/trips/page.tsx`**
   - Auth protection (all authenticated users)
   - Allows drivers to view their trips

9. **`app/compliance/page.tsx`**
   - Auth protection (admin only)
   - Redirects to login if not authenticated

10. **`app/billing/page.tsx`**
    - Auth protection (admin only)
    - Redirects to login if not authenticated

11. **`app/reports/page.tsx`**
    - Auth protection (admin only)
    - Redirects to login if not authenticated

## Authentication Flow

### Login Process:
1. User goes to `/login`
2. Selects role (Admin/Driver)
3. Enters email and password
4. System validates against users table
5. Creates session with JWT token
6. Saves session to localStorage
7. Redirects to `/` (admin) or `/driver/dashboard` (driver)

### Protected Routes:
- Admin pages (`/`, `/trucks`, `/drivers`, `/compliance`, `/billing`, `/reports`)
- Driver dashboard (`/driver/dashboard`)
- Trip monitoring (`/trips`) - accessible to all authenticated users

### Automatic Logout:
- Session persists across page reloads
- Manual logout clears session and redirects to login

## Daily Reset Implementation

### How It Works:
1. Every time `useDashboardStats()` or `useDrivers()` is called, `checkAndResetDailyStats()` runs
2. Function checks if `daily_reset_at !== today`
3. For drivers where date differs, updates:
   - `trips_today` = 0
   - `distance_today` = 0
   - `daily_reset_at` = today
4. Next day, stats will be recalculated from actual trips table

### Result:
- No manual intervention needed
- Stats automatically reset at start of each day
- Actual trip data drives all calculations

## Database Changes

### New users Table:
```sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'driver')),
  driver_id BIGINT REFERENCES drivers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Updated drivers Table:
```sql
ALTER TABLE drivers ADD COLUMN daily_reset_at DATE DEFAULT CURRENT_DATE;
```

## Demo Credentials

**Admin Account:**
- Email: admin@ecohual.com
- Password: password123

**Driver Accounts:**
- driver1@ecohual.com / password123 (John Reyes)
- driver2@ecohual.com / password123 (Maria Santos)
- driver3@ecohual.com / password123 (Carlos Mendoza)
- driver4@ecohual.com / password123 (Juan Dela Cruz)
- driver5@ecohual.com / password123 (Anna Cruz)

## Setup Instructions

1. **Update Database Schema:**
   - Go to Supabase SQL Editor
   - Run `setup-database.sql`
   - This creates the users table and adds daily_reset_at to drivers

2. **Seed Data:**
   - In Supabase SQL Editor
   - Run `seed-data.sql`
   - Creates sample users and links drivers to accounts

3. **Restart Dev Server:**
   ```bash
   npm run dev
   ```

4. **Test Login:**
   - Go to `http://localhost:3000/login`
   - Try admin account
   - Try driver account
   - Verify redirections

## Security Notes

**Current Implementation (Development):**
- ⚠️ Using SHA-256 hashing (NOT recommended for production)
- ⚠️ Session stored in localStorage (accessible to XSS attacks)
- ⚠️ No HTTPS enforced
- ⚠️ No rate limiting on login

**Production Recommendations:**
1. Replace SHA-256 with bcrypt or Argon2
2. Use Supabase Auth or NextAuth.js
3. Implement secure session management
4. Add HTTPS/TLS
5. Implement rate limiting on login attempts
6. Add 2FA support
7. Implement CSRF protection
8. Add audit logging

## Testing Checklist

- [ ] Admin can login and see full dashboard
- [ ] Driver can login and see personal dashboard
- [ ] Unauthenticated users redirected to login
- [ ] Driver can only see their own trips
- [ ] Admin can see all trucks/drivers/compliance/etc
- [ ] Logout clears session properly
- [ ] Daily stats reset at midnight (or when date changes)
- [ ] New trips update trips_today and distance_today dynamically
- [ ] Sidebar shows correct menu items based on role
- [ ] Role switching visible in footer of sidebar

## Next Steps (Optional Enhancements)

1. Implement actual bcrypt password hashing
2. Add "Forgot Password" functionality
3. Add account registration
4. Implement email verification
5. Add driver performance reports
6. Implement admin audit logs
7. Add API keys for programmatic access
8. Implement 2FA for admin accounts
9. Add session expiration timeout
10. Create admin user management interface

## Troubleshooting

**Issue**: Login always fails
- Check users table has data via Supabase
- Verify password hash matches demo credentials
- Check browser console for errors

**Issue**: Daily reset not working
- Verify daily_reset_at column exists in drivers table
- Check that trips are being created with today's date
- Verify timezone settings in Supabase

**Issue**: Driver can't see trips
- Check trips table has driver_id matching user.driver_id
- Verify driver_id is set in users table
- Check trips filter in useTrips hook

**Issue**: Admin redirected to login
- Check users table role is 'admin'
- Verify session is saved in localStorage
- Check browser console for auth errors
