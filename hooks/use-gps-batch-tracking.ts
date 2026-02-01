'use client'

import { useEffect, useRef, useCallback } from 'react'

const GPS_QUEUE_KEY = 'gps_batch_queue'
const GPS_BATCH_SIZE = 10 // Send 10 locations at once
const GPS_BATCH_INTERVAL = 30000 // Send every 30 seconds
const MAX_QUEUE_SIZE = 100 // Prevent memory issues

interface GPSLocation {
  driver_id: number
  trip_id?: number
  latitude: number
  longitude: number
  accuracy: number
  speed?: number
  heading?: number
  timestamp: string
  status: 'pending' | 'synced' | 'failed'
}

/**
 * Hook for batched GPS tracking - sends locations in batches instead of individually
 * This reduces server load and network requests significantly
 */
export function useGPSBatchTracking(driverId?: number, tripId?: number) {
  const batchQueue = useRef<GPSLocation[]>([])
  const isSending = useRef(false)

  // Load queue from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(GPS_QUEUE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        batchQueue.current = parsed.filter((item: GPSLocation) => 
          item.status === 'pending' || item.status === 'failed'
        )
      }
    } catch (error) {
      console.error('Error loading GPS queue:', error)
    }
  }, [])

  // Save queue to localStorage
  const saveQueue = useCallback(() => {
    try {
      localStorage.setItem(GPS_QUEUE_KEY, JSON.stringify(batchQueue.current))
    } catch (error) {
      console.error('Error saving GPS queue:', error)
    }
  }, [])

  // Send batch to server
  const sendBatch = useCallback(async () => {
    if (isSending.current || batchQueue.current.length === 0) return

    isSending.current = true

    try {
      // Get batch to send (up to BATCH_SIZE)
      const batch = batchQueue.current
        .filter(item => item.status === 'pending' || item.status === 'failed')
        .slice(0, GPS_BATCH_SIZE)

      if (batch.length === 0) {
        isSending.current = false
        return
      }

      console.log(`Sending GPS batch: ${batch.length} locations`)

      const response = await fetch('/api/sync/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'gps',
          data: batch.map(item => ({
            driver_id: item.driver_id,
            trip_id: item.trip_id,
            latitude: item.latitude,
            longitude: item.longitude,
            accuracy: item.accuracy,
            speed: item.speed,
            heading: item.heading,
            timestamp: item.timestamp,
          })),
        }),
      })

      if (response.ok) {
        // Remove successfully sent items
        batchQueue.current = batchQueue.current.filter(
          item => !batch.includes(item)
        )
        console.log(`GPS batch sent successfully. ${batchQueue.current.length} remaining`)
      } else {
        // Mark as failed for retry
        batch.forEach(item => {
          item.status = 'failed'
        })
        console.error(`Failed to send GPS batch: ${response.status}`)
      }

      saveQueue()
    } catch (error) {
      console.error('Error sending GPS batch:', error)
      // Items remain in queue for next attempt
    } finally {
      isSending.current = false
    }
  }, [saveQueue])

  // Add location to batch queue
  const addLocation = useCallback((
    driverId: number,
    position: GeolocationPosition,
    tripId?: number
  ) => {
    // Prevent queue from growing too large
    if (batchQueue.current.length >= MAX_QUEUE_SIZE) {
      console.warn('GPS queue at maximum size, dropping oldest entries')
      batchQueue.current = batchQueue.current.slice(-MAX_QUEUE_SIZE + 10)
    }

    const location: GPSLocation = {
      driver_id: driverId,
      trip_id: tripId,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      speed: position.coords.speed ?? undefined,
      heading: position.coords.heading ?? undefined,
      timestamp: new Date(position.timestamp).toISOString(),
      status: 'pending',
    }

    batchQueue.current.push(location)
    saveQueue()
    
    console.log(`GPS location queued. Queue size: ${batchQueue.current.length}`)
  }, [saveQueue])

  // Set up batch sending interval
  useEffect(() => {
    const interval = setInterval(() => {
      sendBatch()
    }, GPS_BATCH_INTERVAL)

    // Send immediately on mount if there are pending items
    if (batchQueue.current.length > 0) {
      setTimeout(sendBatch, 2000)
    }

    // Also send when coming back online
    const handleOnline = () => {
      console.log('Connection restored, sending GPS batch...')
      sendBatch()
    }

    window.addEventListener('online', handleOnline)

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
    }
  }, [sendBatch])

  // Send remaining items before unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (batchQueue.current.length > 0) {
        // Use sendBeacon for guaranteed delivery on page close
        const batch = batchQueue.current.slice(0, GPS_BATCH_SIZE)
        navigator.sendBeacon(
          '/api/sync/batch',
          JSON.stringify({
            type: 'gps',
            data: batch.map(item => ({
              driver_id: item.driver_id,
              trip_id: item.trip_id,
              latitude: item.latitude,
              longitude: item.longitude,
              accuracy: item.accuracy,
              speed: item.speed,
              heading: item.heading,
              timestamp: item.timestamp,
            })),
          })
        )
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  return {
    addLocation,
    sendBatch,
    queueSize: batchQueue.current.length,
  }
}
