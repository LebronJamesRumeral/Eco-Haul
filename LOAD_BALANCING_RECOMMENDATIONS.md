# Load Balancing & Scalability Recommendations

## Critical Priority (Implement First)

### 1. Connection Pooling
```typescript
// lib/supabase.ts - Enhanced Configuration
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: true,
    },
    global: {
      headers: { 'x-application-name': 'eco-haul-dashboard' },
    },
  }
)
```

**Supabase Pro Plan includes:**
- Connection pooling (6000 connections via PgBouncer)
- Configure pool mode: `transaction` or `session`

### 2. GPS Batch Processing
```typescript
// hooks/use-gps-tracking-batch.ts
const GPS_BATCH_SIZE = 10
const GPS_BATCH_INTERVAL = 30000 // 30 seconds

let gpsQueue: GPSLocation[] = []

export function useGPSBatchTracking() {
  const sendBatch = async () => {
    if (gpsQueue.length === 0) return
    
    const batch = gpsQueue.splice(0, GPS_BATCH_SIZE)
    
    await fetch('/api/sync/batch', {
      method: 'POST',
      body: JSON.stringify({ type: 'gps', data: batch }),
    })
  }
  
  useEffect(() => {
    const interval = setInterval(sendBatch, GPS_BATCH_INTERVAL)
    return () => clearInterval(interval)
  }, [])
}
```

### 3. API Rate Limiting
```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function middleware(request: NextRequest) {
  const ip = request.ip ?? 'anonymous'
  const now = Date.now()
  const windowMs = 60000 // 1 minute
  const maxRequests = 100 // 100 requests per minute
  
  const userLimit = rateLimitMap.get(ip)
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return NextResponse.next()
  }
  
  if (userLimit.count >= maxRequests) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }
  
  userLimit.count++
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
```

### 4. Request Queue for Trip Operations
```typescript
// lib/request-queue.ts
class RequestQueue {
  private queue: (() => Promise<any>)[] = []
  private processing = false
  private concurrency = 5 // Process 5 at a time
  
  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
      this.process()
    })
  }
  
  private async process() {
    if (this.processing) return
    this.processing = true
    
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.concurrency)
      await Promise.all(batch.map(fn => fn()))
    }
    
    this.processing = false
  }
}

export const tripQueue = new RequestQueue()
```

## High Priority

### 5. Redis Caching Layer
```typescript
// lib/cache.ts
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 60 // seconds
): Promise<T> {
  const cached = await redis.get(key)
  if (cached) return cached as T
  
  const fresh = await fetcher()
  await redis.set(key, JSON.stringify(fresh), { ex: ttl })
  return fresh
}

// Usage in hooks/use-supabase-data.ts
export function useDashboardStats() {
  useEffect(() => {
    async function fetchStats() {
      const stats = await getCachedData(
        'dashboard:stats',
        async () => {
          // Existing fetch logic
        },
        30 // Cache for 30 seconds
      )
      setStats(stats)
    }
    fetchStats()
  }, [])
}
```

### 6. Background Job Processing
```typescript
// lib/job-queue.ts (Use Vercel Cron or Inngest)
// vercel.json
{
  "crons": [
    {
      "path": "/api/jobs/process-gps",
      "schedule": "*/5 * * * *" // Every 5 minutes
    },
    {
      "path": "/api/jobs/calculate-distances",
      "schedule": "*/10 * * * *" // Every 10 minutes
    }
  ]
}

// app/api/jobs/process-gps/route.ts
export async function GET(request: Request) {
  // Verify cron secret
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  // Process pending GPS calculations in background
  await processGPSDistances()
  
  return Response.json({ success: true })
}
```

### 7. Database Query Optimization
```sql
-- Add composite indexes for common query patterns
CREATE INDEX CONCURRENTLY idx_trips_driver_date 
ON trips(driver_id, date DESC);

CREATE INDEX CONCURRENTLY idx_driver_locations_driver_trip 
ON driver_locations(driver_id, trip_id, timestamp DESC);

-- Add partial indexes for active trips
CREATE INDEX CONCURRENTLY idx_trips_active 
ON trips(driver_id, date) 
WHERE end_time IS NULL;

-- Materialized view for dashboard stats
CREATE MATERIALIZED VIEW dashboard_stats_mv AS
SELECT 
  COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'Active') as active_trucks,
  COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'On Duty') as drivers_on_duty,
  COUNT(t.id) FILTER (WHERE t.date = CURRENT_DATE) as trips_today,
  SUM(t.distance) FILTER (WHERE t.date = CURRENT_DATE) as total_distance
FROM trucks t
LEFT JOIN drivers d ON d.truck_id = t.id
LEFT JOIN trips t ON t.driver_id = d.id;

-- Refresh materialized view every minute (via cron)
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats_mv;
END;
$$ LANGUAGE plpgsql;
```

### 8. Supabase Realtime Channels (Instead of Polling)
```typescript
// hooks/use-realtime-trips.ts
export function useRealtimeTrips() {
  const [trips, setTrips] = useState<Trip[]>([])
  
  useEffect(() => {
    const channel = supabase
      .channel('trips-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trips' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTrips(prev => [payload.new as Trip, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setTrips(prev => prev.map(t => 
              t.id === payload.new.id ? payload.new as Trip : t
            ))
          }
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])
  
  return trips
}
```

## Medium Priority

### 9. CDN & Edge Caching
- Deploy on Vercel Edge Network
- Cache static assets and API responses
- Use `Cache-Control` headers

### 10. Database Read Replicas
- Configure Supabase read replicas for heavy read operations
- Separate read/write operations

### 11. Monitoring & Alerting
```typescript
// lib/monitoring.ts
import * as Sentry from '@sentry/nextjs'

export function trackPerformance(operationName: string, duration: number) {
  if (duration > 1000) {
    Sentry.captureMessage(`Slow operation: ${operationName}`, {
      level: 'warning',
      extra: { duration },
    })
  }
}

// Usage
const start = Date.now()
await createDriverTrip(...)
trackPerformance('create_driver_trip', Date.now() - start)
```

## Architecture Recommendations

### Current: Direct Client → Supabase
```
Client → Supabase → Database
```

### Recommended: Tiered Architecture
```
Client → Next.js API Routes → Queue/Cache → Supabase → Database
         ↓
      Redis Cache
         ↓
   Background Jobs (Cron/Inngest)
```

## Load Testing Recommendations

Test with:
- 100+ concurrent active trips
- 1000+ GPS location updates per minute
- 50+ simultaneous dashboard viewers

Tools:
- **Artillery** - Load testing
- **k6** - Performance testing
- **Supabase Dashboard** - Connection monitoring

## Estimated Capacity with Improvements

| Metric | Current | After Optimization |
|--------|---------|-------------------|
| Concurrent Trips | ~20 | 500+ |
| GPS Updates/min | ~100 | 5000+ |
| Active Users | ~10 | 200+ |
| API Response Time | 200-500ms | 50-150ms |
| Database Connections | Unmanaged | Pooled (6000 max) |

## Implementation Priority

1. ✅ **Week 1**: Connection pooling + Rate limiting
2. ✅ **Week 2**: GPS batching + Request queue
3. ✅ **Week 3**: Redis caching + Background jobs
4. ✅ **Week 4**: Realtime channels + Monitoring
5. ✅ **Week 5**: Load testing + Optimization

## Cost Considerations

- **Supabase Pro**: $25/month (includes pooling, more connections)
- **Upstash Redis**: $10-20/month (caching)
- **Vercel Pro**: $20/user/month (cron jobs, monitoring)
- **Sentry**: Free tier available (monitoring)

**Total**: ~$55-65/month for production-ready scaling
