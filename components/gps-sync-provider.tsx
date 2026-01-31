'use client'

import { useGPSOfflineSync } from '@/hooks/use-gps-offline-sync'

/**
 * Provider component that handles GPS offline sync
 * This component just wraps the hook to make it available app-wide
 */
export function GPSSyncProvider() {
  useGPSOfflineSync()
  return null
}
