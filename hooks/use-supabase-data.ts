import { useEffect, useState, useCallback } from 'react'
import { supabase, type Trip, type Truck, type Driver, type DashboardStats, type ComplianceCheck, type BillingRate, type PayrollRecord, type Site } from '@/lib/supabase'

// Haversine formula to calculate distance between two GPS coordinates (in km)
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Calculate total distance from GPS location points
async function calculateDistanceFromGPS(driverId: number, tripId: number): Promise<number> {
  try {
    const { data: locations, error } = await supabase
      .from('driver_locations')
      .select('latitude, longitude, timestamp')
      .eq('driver_id', driverId)
      .eq('trip_id', tripId)
      .order('timestamp', { ascending: true })

    if (error || !locations || locations.length < 2) {
      console.log('No GPS data for distance calculation:', error)
      return 0
    }

    let totalDistance = 0
    for (let i = 1; i < locations.length; i++) {
      const prev = locations[i - 1]
      const curr = locations[i]
      const distance = calculateHaversineDistance(prev.latitude, prev.longitude, curr.latitude, curr.longitude)
      totalDistance += distance
    }

    return Math.round(totalDistance * 100) / 100 // Round to 2 decimal places
  } catch (err) {
    console.error('Error calculating distance from GPS:', err)
    return 0
  }
}

// Calculate duration from GPS points (min to max timestamp)
function calculateDurationFromTimestamps(startTime: string, endTime: string | null): string {
  try {
    // If endTime is null (active trip), return 0h 00m
    if (!endTime) return '0h 00m'
    
    // Parse time strings like "10:30 AM" or "2:45 PM"
    const parseTime = (timeStr: string) => {
      const match = timeStr.match(/(\d+):(\d+)\s(AM|PM)/)
      if (!match) return null
      let hours = parseInt(match[1])
      const minutes = parseInt(match[2])
      const period = match[3]
      
      if (period === 'PM' && hours !== 12) hours += 12
      if (period === 'AM' && hours === 12) hours = 0
      
      return hours * 60 + minutes // Convert to minutes
    }

    const start = parseTime(startTime)
    const end = parseTime(endTime)
    
    if (start === null || end === null) return '0h 00m'
    
    let duration = end - start
    if (duration < 0) duration += 24 * 60 // Handle day wraparound
    
    const hours = Math.floor(duration / 60)
    const minutes = duration % 60
    
    return `${hours}h ${String(minutes).padStart(2, '0')}m`
  } catch (err) {
    console.error('Error calculating duration:', err)
    return '0h 00m'
  }
}

// Create a manual trip entry for a driver (used when driver clicks "Start Trip")
// If a trip is already active today (end_time === null), complete it
// Otherwise create new trip
export async function createDriverTrip({
  driverId,
  driverName,
  truckId,
  truckNumber,
}: {
  driverId: number
  driverName: string
  truckId?: number | null
  truckNumber?: string | null
}) {
  if (!truckId || !truckNumber) {
    throw new Error('Truck assignment is required to start a trip')
  }

  const today = new Date().toISOString().split('T')[0]
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  console.log('Creating/completing trip for driver:', { driverId, driverName, today })

  // Check if there's an active trip (end_time === null) for this driver today
  const { data: existingTrips, error: fetchError } = await supabase
    .from('trips')
    .select('id, start_time, end_time')
    .eq('driver_id', driverId)
    .eq('date', today)
    .order('created_at', { ascending: false })

  if (fetchError) {
    console.error('Error fetching existing trip:', fetchError)
    throw new Error(fetchError.message || 'Failed to fetch existing trip')
  }

  console.log('Existing trips found:', existingTrips?.length || 0)

  // Find the active trip (where end_time is null)
  const activeTrip = existingTrips?.find(t => t.end_time === null)
  
  if (activeTrip) {
    console.log('Found active trip:', activeTrip)
    // Trip is active, complete it by setting end_time to current time
    console.log('Completing active trip:', activeTrip.id)
    
    let endTime = now
    if (endTime === activeTrip.start_time) {
      // Parse the start time and add 1 minute to ensure it's different
      const timeMatch = activeTrip.start_time.match(/(\d+):(\d+)\s(AM|PM)/)
      if (!timeMatch) {
        console.error('Failed to parse time format:', activeTrip.start_time)
        throw new Error('Invalid time format')
      }
      
      let hours = parseInt(timeMatch[1])
      let mins = parseInt(timeMatch[2])
      const period = timeMatch[3]
      
      mins += 1
      if (mins >= 60) {
        mins = 0
        hours += 1
        if (hours > 12) {
          hours = 1
        }
      }
      
      endTime = `${hours}:${String(mins).padStart(2, '0')} ${period}`
    }
    console.log(`Updating end_time from ${activeTrip.start_time} to ${endTime}`)
    
    // Calculate distance from GPS points and duration
    const distance = await calculateDistanceFromGPS(driverId, activeTrip.id)
    const duration = calculateDurationFromTimestamps(activeTrip.start_time, endTime)
    const cost = `₱${(distance * 50).toLocaleString('en-PH', { maximumFractionDigits: 2 })}`
    
    console.log(`Trip stats - Distance: ${distance}km, Duration: ${duration}, Cost: ${cost}`)
    
    const { data, error } = await supabase
      .from('trips')
      .update({ 
        end_time: endTime,
        distance: distance.toString(),
        duration: duration,
        cost: cost
      })
      .eq('id', activeTrip.id)
      .select()

    if (error) {
      console.error('Error completing trip:', error)
      throw new Error(error.message || 'Failed to complete trip')
    }

    if (!data || !data[0]) {
      console.error('Trip update returned no data')
      throw new Error('Trip update returned no data')
    }

    console.log('Trip completed successfully:', data[0])
    return data[0]
  } else {
    console.log('No active trip found, will create new trip')
  }

  // No active trip exists, create new trip
  console.log('Creating new trip')
  
  // Generate receipt number: Get today's trip count for this truck to create sequential number
  const { data: todayTruckTrips, error: countError } = await supabase
    .from('trips')
    .select('id')
    .eq('truck_id', truckId)
    .eq('date', today)
  
  if (countError) {
    console.error('Error counting trips:', countError)
  }
  
  // Generate receipt number in format: RCP-{truck_number}-{sequential}
  const tripSequence = (todayTruckTrips?.length || 0) + 1
  const receiptNumber = `RCP-${truckNumber.replace(/[^0-9]/g, '').padStart(3, '0')}-${String(tripSequence).padStart(3, '0')}`
  console.log('Generated receipt number:', receiptNumber)
  
  const { data, error } = await supabase
    .from('trips')
    .insert([
      {
        date: today,
        driver_id: driverId,
        driver_name: driverName,
        truck_id: truckId,
        truck_number: truckNumber,
        driver_receipt_number: receiptNumber,
        start_time: now,
        end_time: null, // null means trip is active
        distance: 0,
        duration: '0h 00m',
        cost: '₱0',
      },
    ])
    .select()

  if (error) {
    console.error('Error inserting trip:', error)
    throw new Error(error.message || 'Failed to create trip')
  }

  if (!data || !data[0]) {
    console.error('Trip insert returned no data')
    throw new Error('Trip insert returned no data')
  }

  console.log('Trip created successfully:', data[0])
  return data[0]
}

// Helper function to reset driver daily stats if needed
async function checkAndResetDailyStats() {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // Get all drivers with daily_reset_at not equal to today
    const { data: driversToReset } = await supabase
      .from('drivers')
      .select('id')
      .neq('daily_reset_at', today)
    
    if (driversToReset && driversToReset.length > 0) {
      // Reset trips_today and distance_today for all drivers
      const { error } = await supabase
        .from('drivers')
        .update({ trips_today: 0, distance_today: 0, daily_reset_at: today })
        .neq('daily_reset_at', today)
      
      if (error) {
        console.error('Error resetting daily stats:', error)
      }
    }
  } catch (err) {
    console.error('Error checking daily reset:', err)
  }
}

// Hook to fetch dashboard stats (calculated from actual data)
export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true)
        
        // Check and reset daily stats if needed
        await checkAndResetDailyStats()
        
        // Get active trucks count
        const { count: trucksCount } = await supabase
          .from('trucks')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'Active')
        
        // Get drivers on duty count
        const { count: driversCount } = await supabase
          .from('drivers')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'On Duty')
        
        // Get today's trips
        const today = new Date().toISOString().split('T')[0]
        const { data: tripsData } = await supabase
          .from('trips')
          .select('distance, cost')
          .eq('date', today)
        
        // Calculate total distance and payroll cost
        const totalDistance = tripsData?.reduce((sum, trip) => sum + Number(trip.distance), 0) || 0
        const payrollCost = tripsData?.reduce((sum, trip) => {
          const cost = trip.cost.replace(/[₱,]/g, '')
          return sum + Number(cost)
        }, 0) || 0
        
        setStats({
          active_trucks: trucksCount ?? 0,
          drivers_on_duty: driversCount ?? 0,
          trips_today: tripsData?.length ?? 0,
          total_distance: totalDistance,
          payroll_cost: payrollCost
        })
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return { stats, loading, error }
}

// Hook to fetch trips
export function useTrips(filters?: { date?: string; truck?: string; driver?: string; search?: string }) {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchTrips = useCallback(async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (filters?.date) {
        query = query.eq('date', filters.date)
      }
      if (filters?.truck) {
        query = query.eq('truck_number', filters.truck)
      }
      if (filters?.driver) {
        query = query.eq('driver_name', filters.driver)
      }
      if (filters?.search && filters.search.trim().length > 0) {
        const s = `%${filters.search.trim()}%`
        query = query.or(`truck_number.ilike.${s},driver_name.ilike.${s}`)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      setTrips(data || [])
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [filters?.date, filters?.truck, filters?.driver, filters?.search])

  useEffect(() => {
    fetchTrips()
  }, [fetchTrips])

  return { trips, loading, error, refetch: fetchTrips }
}

// Hook to fetch trucks
export function useTrucks(search?: string) {
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchTrucks() {
      try {
        setLoading(true)
        let query = supabase
          .from('trucks')
          .select('*')

        if (search && search.trim().length > 0) {
          const s = `%${search.trim()}%`
          query = query.or(
            `truck_number.ilike.${s},plate_number.ilike.${s},driver_name.ilike.${s}`
          )
        }

        const { data, error } = await query
        if (error) throw error
        setTrucks(data || [])
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchTrucks()
  }, [search])

  return { trucks, loading, error }
}

// Hook to fetch drivers (with dynamic trip counts calculated from trips table)
export function useDrivers(search?: string) {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchDrivers() {
      try {
        setLoading(true)
        
        // Check and reset daily stats if needed
        await checkAndResetDailyStats()
        
        let query = supabase
          .from('drivers')
          .select('*')

        if (search && search.trim().length > 0) {
          const s = `%${search.trim()}%`
          query = query.or(
            `name.ilike.${s},truck_number.ilike.${s}`
          )
        }

        const { data, error } = await query
        if (error) throw error
        
        // Calculate trips_today and distance_today from actual trips
        const today = new Date().toISOString().split('T')[0]
        const driversWithStats = await Promise.all(
          (data || []).map(async (driver) => {
            const { data: trips } = await supabase
              .from('trips')
              .select('distance')
              .eq('driver_id', driver.id)
              .eq('date', today)
            
            const trips_today = trips?.length || 0
            const distance_today = trips?.reduce((sum, trip) => sum + Number(trip.distance), 0) || 0
            
            return { ...driver, trips_today, distance_today }
          })
        )
        
        setDrivers(driversWithStats)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchDrivers()
  }, [search])

  return { drivers, loading, error }
}

// Hook to fetch chart data
export function useChartData() {
  const [tripsPerDay, setTripsPerDay] = useState<{ day: string; trips: number }[]>([])
  const [distancePerTruck, setDistancePerTruck] = useState<{ truck: string; distance: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchChartData() {
      try {
        setLoading(true)
        
        // Fetch trips per day for the last 7 days
        const { data: tripsData } = await supabase
          .from('trips')
          .select('date')
          .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        
        // Group by day
        const tripsByDay = tripsData?.reduce((acc: any, trip) => {
          const day = new Date(trip.date).toLocaleDateString('en-US', { weekday: 'short' })
          acc[day] = (acc[day] || 0) + 1
          return acc
        }, {})
        
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const tripsPerDayData = days.map(day => ({
          day,
          trips: tripsByDay?.[day] || 0
        }))
        
        setTripsPerDay(tripsPerDayData)
        
        // Fetch distance per truck for today
        const { data: distanceData } = await supabase
          .from('trips')
          .select('truck_number, distance')
          .eq('date', new Date().toISOString().split('T')[0])
        
        // Group by truck
        const distanceByTruck = distanceData?.reduce((acc: any, trip) => {
          acc[trip.truck_number] = (acc[trip.truck_number] || 0) + Number(trip.distance)
          return acc
        }, {})
        
        const distancePerTruckData = Object.entries(distanceByTruck || {}).map(([truck, distance]) => ({
          truck,
          distance: Math.round(distance as number)
        }))
        
        setDistancePerTruck(distancePerTruckData)
      } catch (err) {
        console.error('Error fetching chart data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchChartData()
  }, [])

  return { tripsPerDay, distancePerTruck, loading }
}

// Hook for real-time subscriptions
export function useRealtimeTrips() {
  const [trips, setTrips] = useState<Trip[]>([])

  useEffect(() => {
    // Initial fetch
    supabase
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setTrips(data || []))

    // Subscribe to changes
    const channel = supabase
      .channel('trips-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trips' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTrips((current) => [payload.new as Trip, ...current])
          } else if (payload.eventType === 'UPDATE') {
            setTrips((current) =>
              current.map((trip) =>
                trip.id === (payload.new as Trip).id ? (payload.new as Trip) : trip
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setTrips((current) =>
              current.filter((trip) => trip.id !== (payload.old as Trip).id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { trips }
}

// Helper functions for CRUD operations
export async function createTrip(trip: Omit<Trip, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('trips')
    .insert([trip])
    .select()
  
  if (error) throw error
  return data[0]
}

export async function updateTrip(id: number, updates: Partial<Trip>) {
  const { data, error } = await supabase
    .from('trips')
    .update(updates)
    .eq('id', id)
    .select()
  
  if (error) throw error
  return data[0]
}

export async function deleteTrip(id: number) {
  const { error } = await supabase
    .from('trips')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Drivers CRUD
export async function createDriver(driver: Omit<Driver, 'id' | 'created_at' | 'trips_today' | 'distance_today'> & { trips_today?: number; distance_today?: number }) {
  const { data, error } = await supabase
    .from('drivers')
    .insert([driver])
    .select()
  if (error) throw error
  return data?.[0]
}

export async function updateDriver(id: number, updates: Partial<Driver>) {
  const { data, error } = await supabase
    .from('drivers')
    .update(updates)
    .eq('id', id)
    .select()
  if (error) throw error
  return data?.[0]
}

export async function deleteDriver(id: number) {
  const { error } = await supabase
    .from('drivers')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// Trucks CRUD
export async function createTruck(truck: Omit<Truck, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('trucks')
    .insert([truck])
    .select()
  if (error) throw error
  return data?.[0]
}

export async function updateTruck(id: number, updates: Partial<Truck>) {
  const { data, error } = await supabase
    .from('trucks')
    .update(updates)
    .eq('id', id)
    .select()
  if (error) throw error
  return data?.[0]
}

export async function deleteTruck(id: number) {
  const { error } = await supabase
    .from('trucks')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// Assignment helpers: link driver and truck on both sides
export async function assignDriverToTruck(driverId: number, truckId: number) {
  // Fetch driver and truck
  const { data: driver } = await supabase.from('drivers').select('*').eq('id', driverId).single()
  const { data: truck } = await supabase.from('trucks').select('*').eq('id', truckId).single()

  // Update both records
  const driverUpdate = supabase
    .from('drivers')
    .update({ truck_id: truckId, truck_number: truck?.truck_number })
    .eq('id', driverId)

  const truckUpdate = supabase
    .from('trucks')
    .update({ driver_id: driverId, driver_name: driver?.name, status: truck?.status ?? 'Active' })
    .eq('id', truckId)

  const [dRes, tRes] = await Promise.all([driverUpdate, truckUpdate])
  if (dRes.error) throw dRes.error
  if (tRes.error) throw tRes.error
}

export async function unassignDriverFromTruck(driverId: number, truckId: number) {
  const dRes = await supabase
    .from('drivers')
    .update({ truck_id: null, truck_number: null })
    .eq('id', driverId)
  if (dRes.error) throw dRes.error

  const tRes = await supabase
    .from('trucks')
    .update({ driver_id: null, driver_name: null })
    .eq('id', truckId)
  if (tRes.error) throw tRes.error
}

// Compliance hooks
export function useComplianceChecks(search?: string, status?: 'Compliant' | 'Needs Review' | 'Non-Compliant') {
  const [checks, setChecks] = useState<ComplianceCheck[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchChecks() {
      try {
        setLoading(true)
        let query = supabase
          .from('compliance_checks')
          .select('*')
          .order('last_check', { ascending: false })

        if (status) {
          query = query.eq('status', status)
        }
        if (search && search.trim().length > 0) {
          const s = `%${search.trim()}%`
          query = query.or(`site.ilike.${s},truck_number.ilike.${s}`)
        }

        const { data, error } = await query
        if (error) throw error
        setChecks(data || [])
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchChecks()
  }, [search, status])

  return { checks, loading, error }
}

// Billing & Payroll hooks
export function useBillingRates() {
  const [rates, setRates] = useState<BillingRate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchRates() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('billing_rates')
          .select('*')
          .single()
        
        if (error) throw error
        setRates(data)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchRates()
  }, [])

  return { rates, loading, error }
}

export function usePayrollRecords(filters?: { driver?: string; date?: string }) {
  const [records, setRecords] = useState<PayrollRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchRecords() {
      try {
        setLoading(true)
        let query = supabase
          .from('payroll_records')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (filters?.driver) {
          query = query.ilike('driver_name', `%${filters.driver}%`)
        }
        if (filters?.date) {
          query = query.eq('date', filters.date)
        }
        
        const { data, error } = await query
        
        if (error) throw error
        setRecords(data || [])
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecords()
  }, [filters?.driver, filters?.date])

  return { records, loading, error }
}

// Reports hooks
export function useReportsData() {
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchReportsData() {
      try {
        setLoading(true)
        
        // Fetch monthly aggregated data for the last 6 months
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
        
        const { data: tripsData, error } = await supabase
          .from('trips')
          .select('date, distance, cost')
          .gte('date', sixMonthsAgo.toISOString().split('T')[0])
        
        if (error) throw error
        
        // Group by month
        const monthlyMap = new Map()
        tripsData?.forEach(trip => {
          const date = new Date(trip.date)
          const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
          
          if (!monthlyMap.has(monthKey)) {
            monthlyMap.set(monthKey, { month: monthKey, trips: 0, distance: 0, cost: 0 })
          }
          
          const monthData = monthlyMap.get(monthKey)
          monthData.trips++
          monthData.distance += Number(trip.distance)
          monthData.cost += Number(trip.cost.replace(/[₱,]/g, ''))
        })
        
        const sortedData = Array.from(monthlyMap.values())
          .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
          .map(item => ({
            ...item,
            month: new Date(item.month).toLocaleDateString('en-US', { month: 'long' }),
            distance: Math.round(item.distance),
            cost: Math.round(item.cost)
          }))
        
        setMonthlyData(sortedData)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchReportsData()
  }, [])

  return { monthlyData, loading, error }
}

// CRUD helpers for billing and compliance
export async function updateBillingRates(rates: Partial<BillingRate>) {
  const { data, error } = await supabase
    .from('billing_rates')
    .update(rates)
    .eq('id', 1)
    .select()
  
  if (error) throw error
  return data[0]
}

export async function createPayrollRecord(record: Omit<PayrollRecord, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('payroll_records')
    .insert([record])
    .select()
  
  if (error) throw error
  return data[0]
}

export async function createComplianceCheck(check: Omit<ComplianceCheck, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('compliance_checks')
    .insert([check])
    .select()
  
  if (error) throw error
  return data[0]
}

export async function updateComplianceCheck(id: number, updates: Partial<ComplianceCheck>) {
  const { data, error } = await supabase
    .from('compliance_checks')
    .update(updates)
    .eq('id', id)
    .select()
  
  if (error) throw error
  return data[0]
}
// Hook to fetch driver-specific data by driver_id
export function useDriverData(driverId?: number) {
  const [driver, setDriver] = useState<Driver | null>(null)
  const [truck, setTruck] = useState<Truck | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!driverId) {
      setLoading(false)
      return
    }

    async function fetchDriverData() {
      try {
        setLoading(true)
        
        // Fetch driver details
        const { data: driverData, error: driverError } = await supabase
          .from('drivers')
          .select('*')
          .eq('id', driverId)
          .single()
        
        if (driverError) throw driverError
        setDriver(driverData)
        
        // Fetch truck assigned to driver
        if (driverData?.truck_id) {
          const { data: truckData, error: truckError } = await supabase
            .from('trucks')
            .select('*')
            .eq('id', driverData.truck_id)
            .single()
          
          if (truckError) {
            console.error('Error fetching truck:', truckError)
          } else {
            setTruck(truckData)
          }
        }
        
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch driver data'))
      } finally {
        setLoading(false)
      }
    }

    fetchDriverData()
  }, [driverId])

  return { driver, truck, loading, error }
}

// Hook to fetch driver's compliance records
export function useDriverComplianceRecords(driverId?: number) {
  const [records, setRecords] = useState<ComplianceCheck[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchRecords = useCallback(async () => {
    if (!driverId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      const { data: driverData } = await supabase
        .from('drivers')
        .select('truck_id')
        .eq('id', driverId)
        .single()
      
      if (!driverData?.truck_id) {
        setRecords([])
        setLoading(false)
        return
      }
      
      const { data, error: err } = await supabase
        .from('compliance_checks')
        .select('*')
        .eq('truck_id', driverData.truck_id)
        .order('last_check', { ascending: false })
        .limit(10)
      
      if (err) throw err
      setRecords(data || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching compliance records:', err)
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [driverId])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  return { records, loading, error, refetch: fetchRecords }
}

// Hook to fetch driver's payroll records
export function useDriverPayroll(driverId?: number) {
  const [payroll, setPayroll] = useState<PayrollRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!driverId) {
      setLoading(false)
      return
    }

    async function fetchPayroll() {
      try {
        setLoading(true)
        
        const { data, error: err } = await supabase
          .from('payroll_records')
          .select('*')
          .eq('driver_id', driverId)
          .order('date', { ascending: false })
          .limit(12)
        
        if (err) throw err
        setPayroll(data || [])
        setError(null)
      } catch (err) {
        console.error('Error fetching payroll:', err)
        setPayroll([])
      } finally {
        setLoading(false)
      }
    }

    fetchPayroll()
  }, [driverId])

  return { payroll, loading, error }
}

// GPS Tracking Hook - Save driver location with offline support
export function useGPSTracking() {
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendLocation = useCallback(async (driverId: number, position: GeolocationPosition, tripId?: number) => {
    setSending(true)
    setError(null)

    try {
      const locationData: any = {
        driver_id: driverId,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed || null,
        heading: position.coords.heading || null,
        timestamp: new Date().toISOString()
      }
      
      // Link to trip if provided
      if (tripId) {
        locationData.trip_id = tripId
      }

      // Try to send to server
      const { data, error } = await supabase
        .from('driver_locations')
        .insert(locationData)

      if (error) throw error
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send location'
      setError(message)
      console.error('GPS tracking error:', err)
      
      // If offline, queue the location for later sync
      if (!navigator.onLine) {
        try {
          const gpsQueue = JSON.parse(localStorage.getItem('gps_queue') || '[]')
          gpsQueue.push({
            id: `gps-${Date.now()}`,
            type: 'gps',
            data: {
              driver_id: driverId,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              speed: position.coords.speed || null,
              heading: position.coords.heading || null,
              timestamp: new Date().toISOString(),
              trip_id: tripId || null
            },
            timestamp: Date.now(),
            status: 'pending'
          })
          localStorage.setItem('gps_queue', JSON.stringify(gpsQueue))
          console.log('GPS location queued for offline sync:', locationData)
        } catch (queueErr) {
          console.error('Failed to queue GPS location:', queueErr)
        }
      }
    } finally {
      setSending(false)
    }
  }, [])

  return { sendLocation, sending, error }
}

// Get all driver locations (for admin)
export function useDriverLocations() {
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLocations() {
      try {
        const { data, error } = await supabase
          .from('latest_driver_locations')
          .select('*')
          .order('timestamp', { ascending: false })

        if (error) throw error
        setLocations(data || [])
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch locations'
        setError(message)
        console.error('Error fetching driver locations:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchLocations()
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchLocations, 10000)
    return () => clearInterval(interval)
  }, [])

  return { locations, loading, error }
}

// Toggle tracking for a driver (admin only)
export function useToggleTracking() {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleTracking = useCallback(async (driverId: number, enabled: boolean) => {
    setUpdating(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('drivers')
        .update({ tracking_enabled: enabled })
        .eq('id', driverId)

      if (error) throw error
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update tracking'
      setError(message)
      console.error('Toggle tracking error:', err)
    } finally {
      setUpdating(false)
    }
  }, [])

  return { toggleTracking, updating, error }
}

// Auto-generate trips from GPS data
export function useAutoGenerateTrips() {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null)

  const generateTripsFromGPS = useCallback(async () => {
    setGenerating(true)
    setError(null)

    try {
      // Call the database function to auto-create trips
      const { data, error } = await supabase.rpc('auto_create_trips_from_gps')

      if (error) {
        // Check if function doesn't exist
        if (error.code === '42883' || error.message?.includes('function') || error.message?.includes('does not exist')) {
          console.warn('⚠️ Database function auto_create_trips_from_gps() not found. Please run scripts/setup-gps-trips.sql in your Supabase SQL editor.')
          setError('GPS function not deployed. Please contact administrator.')
          return // Silent fail - don't throw
        }
        
        console.error('RPC Error Details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        })
        throw new Error(error.message || 'Failed to call auto_create_trips_from_gps')
      }
      
      if (data) {
        console.log('✅ Auto-generated trips from GPS:', data)
      } else {
        console.log('✅ RPC function executed successfully')
      }
      
      setLastGenerated(new Date())
      return data
    } catch (err) {
      // If RPC fails, try manual trip creation from GPS data
      console.warn('Falling back to manual trip generation from GPS data...', err)
      
      try {
        // Get all drivers with GPS data today
        const today = new Date().toISOString().split('T')[0]
        const { data: drivers, error: driversError } = await supabase
          .from('driver_locations')
          .select('driver_id')
          .gte('timestamp', `${today}T00:00:00`)
          .lt('timestamp', `${today}T23:59:59`)

        if (driversError) throw driversError

        // Group by driver and create trips for each
        const driverIds = [...new Set(drivers?.map(d => d.driver_id) || [])]
        
        for (const driverId of driverIds) {
          const distance = await calculateDistanceFromGPS(driverId, today)
          if (distance > 0) {
            await createDriverTrip({
              driver_id: driverId,
              truck_id: undefined,
              distance,
              cost: distance * 50,
              start_time: new Date().toISOString(),
              end_time: new Date().toISOString(),
              duration: '0h 00m'
            })
          }
        }

        console.log(`Manually created trips for ${driverIds.length} drivers`)
        setLastGenerated(new Date())
      } catch (fallbackErr) {
        const message = fallbackErr instanceof Error ? fallbackErr.message : JSON.stringify(fallbackErr) || 'Unknown error generating trips from GPS'
        setError(message)
        console.error('Auto-generate trips error (both RPC and fallback failed):', message, err, fallbackErr)
      }
    } finally {
      setGenerating(false)
    }
  }, [])

  // Auto-call on component mount and periodically
  useEffect(() => {
    // Only call once on mount, not every time generateTripsFromGPS changes
    generateTripsFromGPS().catch(err => {
      console.error('Initial trip generation failed:', err)
    })
    
    // Auto-generate every 5 minutes
    const interval = setInterval(() => {
      generateTripsFromGPS().catch(err => {
        console.error('Periodic trip generation failed:', err)
      })
    }, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [generateTripsFromGPS])

  return { generateTripsFromGPS, generating, error, lastGenerated }
}

// Update driver daily stats from GPS
export function useUpdateDriverStats() {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateStats = useCallback(async () => {
    setUpdating(true)
    setError(null)

    try {
      // Call the database function to update driver stats
      const { error } = await supabase.rpc('update_driver_daily_stats')

      if (error) throw error
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update driver stats'
      setError(message)
      console.error('Update stats error:', err)
    } finally {
      setUpdating(false)
    }
  }, [])

  return { updateStats, updating, error }
}

// Sites Management
export function useSites() {
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSites() {
      try {
        const { data, error } = await supabase
          .from('sites')
          .select('*')
          .order('name', { ascending: true })

        if (error) throw error
        
        // Map snake_case columns to camelCase for TypeScript
        const mappedSites = (data || []).map((site: any) => ({
          id: site.id,
          name: site.name,
          location: site.location,
          status: site.status,
          description: site.description,
          pricePerUnit: site.price_per_unit,
          unitType: site.unit_type,
          created_at: site.created_at,
        }))
        
        setSites(mappedSites)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch sites'
        setError(message)
        console.error('Error fetching sites:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSites()
  }, [])

  return { sites, loading, error }
}

export async function createSite(site: { name: string; location: string; status: string; description?: string; pricePerUnit?: number; unitType?: string }) {
  try {
    // Convert camelCase to snake_case for Supabase
    const siteData = {
      name: site.name,
      location: site.location,
      status: site.status,
      description: site.description,
      price_per_unit: site.pricePerUnit || null,
      unit_type: site.unitType || 'CBM',
    }

    const { data, error } = await supabase
      .from('sites')
      .insert([siteData])
      .select()

    if (error) throw error
    return data[0]
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create site'
    throw new Error(message)
  }
}

export async function updateSite(id: number, updates: Partial<Site>) {
  try {
    // Convert camelCase to snake_case for Supabase
    const updateData: any = {}
    
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.location !== undefined) updateData.location = updates.location
    if (updates.status !== undefined) updateData.status = updates.status
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.pricePerUnit !== undefined) updateData.price_per_unit = updates.pricePerUnit
    if (updates.unitType !== undefined) updateData.unit_type = updates.unitType

    const { data, error } = await supabase
      .from('sites')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) throw error
    return data[0]
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update site'
    throw new Error(message)
  }
}

export async function deleteSite(id: number) {
  try {
    const { error } = await supabase
      .from('sites')
      .delete()
      .eq('id', id)

    if (error) throw error
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete site'
    throw new Error(message)
  }
}