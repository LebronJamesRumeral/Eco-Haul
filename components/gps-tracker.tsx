'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useGPSTracking } from '@/hooks/use-supabase-data'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MapPin } from 'lucide-react'

interface GPSTrackerProps {
  activeTrip: any | null // Only track GPS when there's an active trip
}

export function GPSTracker({ activeTrip }: GPSTrackerProps) {
  const { user } = useAuth()
  const { sendLocation, error } = useGPSTracking()
  const [trackingStatus, setTrackingStatus] = useState<'active' | 'inactive' | 'error'>('inactive')
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [geoError, setGeoError] = useState<string | null>(null)
  const watchIdRef = useRef<number | null>(null)

  const getErrorMessage = (err: GeolocationPositionError) => {
    switch (err.code) {
      case err.PERMISSION_DENIED:
        return 'Location permission denied. Please enable location access in browser settings.'
      case err.POSITION_UNAVAILABLE:
        return 'Location information is unavailable. Please check your GPS settings.'
      case err.TIMEOUT:
        return 'Location request timed out. Please try again.'
      default:
        return 'Unable to get your location. Please check your GPS settings and try again.'
    }
  }

  useEffect(() => {
    // Only track if user is a driver with driver_id AND has an active trip
    if (!user || user.role !== 'driver' || !user.driver_id || !activeTrip) {
      // Stop tracking if no active trip
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
        setTrackingStatus('inactive')
      }
      return
    }

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by this browser')
      setTrackingStatus('error')
      return
    }

    // Start watching position only when trip is active
    const startTracking = () => {
      watchIdRef.current = navigator.geolocation.watchPosition(
        async (position) => {
          try {
            // Pass trip ID to link GPS point to trip
            await sendLocation(user.driver_id!, position, activeTrip?.id)
            setTrackingStatus('active')
            setLastUpdate(new Date())
            setGeoError(null)
          } catch (err) {
            console.error('Failed to send location:', err)
            setTrackingStatus('error')
          }
        },
        (err) => {
          const errorMessage = getErrorMessage(err)
          console.error('Geolocation error:', errorMessage)
          setGeoError(errorMessage)
          setTrackingStatus('error')
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000 // Cache position for 30 seconds
        }
      )
    }

    startTracking()

    // Cleanup on unmount or when trip ends
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [user, sendLocation, activeTrip])

  // Don't show anything for non-drivers
  if (!user || user.role !== 'driver') {
    return null
  }

  // Show error if tracking failed
  if (trackingStatus === 'error' && (error || geoError)) {
    return (
      <Alert variant="destructive" className="mb-4">
        <MapPin className="h-4 w-4" />
        <AlertDescription>
          {geoError || error || 'GPS tracking error. Please check location permissions.'}
        </AlertDescription>
      </Alert>
    )
  }

  // Show tracking status
  return (
    <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
      <MapPin className={`h-4 w-4 ${trackingStatus === 'active' ? 'text-green-500' : 'text-gray-400'}`} />
      <span>
        GPS Tracking: {trackingStatus === 'active' ? 'Active' : 'Connecting...'}
        {lastUpdate && trackingStatus === 'active' && (
          <span className="ml-2">
            (Last update: {lastUpdate.toLocaleTimeString()})
          </span>
        )}
      </span>
    </div>
  )
}
