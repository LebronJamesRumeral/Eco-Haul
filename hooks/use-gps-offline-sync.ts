'use client'

import { useEffect } from 'react'

const GPS_QUEUE_KEY = 'gps_queue'

/**
 * Hook to sync queued GPS locations when connection is restored
 */
export function useGPSOfflineSync() {
  useEffect(() => {
    const syncGPSLocations = async () => {
      try {
        const queueData = localStorage.getItem(GPS_QUEUE_KEY)
        if (!queueData) return

        const gpsQueue = JSON.parse(queueData)
        const pendingLocations = gpsQueue.filter((item: any) => item.status === 'pending')

        if (pendingLocations.length === 0) return

        console.log(`Syncing ${pendingLocations.length} GPS locations...`)

        for (const location of pendingLocations) {
          try {
            const response = await fetch('/api/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'gps',
                data: location.data,
              }),
            })

            if (response.ok) {
              // Mark as synced
              location.status = 'synced'
              console.log(`GPS location synced: ${location.data.timestamp}`)
            } else {
              console.error(`Failed to sync GPS location: ${response.status}`)
            }
          } catch (error) {
            console.error(`Error syncing GPS location:`, error)
          }
        }

        // Update localStorage - remove synced items
        const updatedQueue = gpsQueue.filter((item: any) => item.status !== 'synced')
        if (updatedQueue.length > 0) {
          localStorage.setItem(GPS_QUEUE_KEY, JSON.stringify(updatedQueue))
        } else {
          localStorage.removeItem(GPS_QUEUE_KEY)
        }

        console.log(`GPS sync complete. ${updatedQueue.length} items remaining.`)
      } catch (error) {
        console.error('Error syncing GPS queue:', error)
      }
    }

    // Monitor online status
    const handleOnline = () => {
      console.log('Connection restored, syncing GPS data...')
      syncGPSLocations()
    }

    window.addEventListener('online', handleOnline)

    // Also check on component mount if online
    if (navigator.onLine) {
      syncGPSLocations()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
    }
  }, [])
}
