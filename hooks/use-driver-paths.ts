import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Hook to fetch driver route/path for a specific trip or date
export async function getDriverPath(driverId: number, tripId?: number, date?: string) {
  try {
    let query = supabase
      .from('driver_locations')
      .select('driver_id, latitude, longitude, timestamp, trip_id')
      .eq('driver_id', driverId)
      .order('timestamp', { ascending: true })

    if (tripId) {
      query = query.eq('trip_id', tripId)
    } else if (date) {
      query = query.gte('timestamp', `${date}T00:00:00`)
             .lt('timestamp', `${date}T23:59:59`)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error fetching driver path:', err)
    return []
  }
}

// Hook to fetch all active driver paths (today)
export async function getAllDriverPaths(date?: string) {
  try {
    const today = date || new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('driver_locations')
      .select(`
        driver_id,
        latitude,
        longitude,
        timestamp,
        trip_id
      `)
      .gte('timestamp', `${today}T00:00:00`)
      .lt('timestamp', `${today}T23:59:59`)
      .order('driver_id', { ascending: true })
      .order('timestamp', { ascending: true })

    if (error) throw error

    // Get driver names
    const driverIds = [...new Set(data?.map(loc => loc.driver_id) || [])]
    const { data: drivers } = await supabase
      .from('drivers')
      .select('id, name, truck_number')
      .in('id', driverIds)

    const driverMap = new Map(drivers?.map(d => [d.id, d]) || [])

    // Enhance location data with driver info
    const enhancedData = data?.map(loc => ({
      ...loc,
      driver_name: driverMap.get(loc.driver_id)?.name || `Driver ${loc.driver_id}`,
      truck_number: driverMap.get(loc.driver_id)?.truck_number,
    })) || []

    return enhancedData
  } catch (err) {
    console.error('Error fetching all driver paths:', err)
    return []
  }
}

// Hook to fetch specific trip path with realtime updates
export function useDriverTripPath(driverId?: number, tripId?: number) {
  const [path, setPath] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!driverId || !tripId) {
      setLoading(false)
      return
    }

    async function fetchPath() {
      try {
        const data = await getDriverPath(driverId!, tripId)
        setPath(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch path')
      } finally {
        setLoading(false)
      }
    }

    fetchPath()

    // Set up realtime subscription
    const channel = supabase
      .channel(`trip-path-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'driver_locations',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          console.log('New GPS point for trip:', payload.new)
          setPath((prev) => [...prev, payload.new])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [driverId, tripId])

  return { path, loading, error }
}
