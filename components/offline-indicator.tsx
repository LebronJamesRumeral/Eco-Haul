"use client"

import { useOfflineStatus } from "@/hooks/use-offline-sync"
import { AlertCircle, Wifi, WifiOff } from "lucide-react"

export function OfflineIndicator() {
  const { isOnline, hasPendingOperations, isSyncing, pendingCount } = useOfflineStatus()

  if (isOnline && !hasPendingOperations) {
    return null
  }

  return (
    <div className="fixed top-4 left-4 z-40 max-w-xs">
      {!isOnline && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-3">
          <WifiOff className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900 dark:text-red-200">
              You're offline
            </p>
            <p className="text-xs text-red-700 dark:text-red-300">
              Changes will sync when you're back online
            </p>
          </div>
        </div>
      )}

      {isOnline && hasPendingOperations && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center gap-3">
          <div className="flex-shrink-0">
            {isSyncing ? (
              <div className="animate-spin">
                <Wifi className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            ) : (
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
              {isSyncing ? 'Syncing...' : `${pendingCount} pending changes`}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {isSyncing ? 'Uploading to server...' : 'Ready to sync'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
