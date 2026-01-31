import { useEffect, useState } from 'react'

export interface OfflineOperation {
  id: string
  type: 'payroll' | 'billing' | 'trip' | 'compliance'
  data: any
  timestamp: number
  status: 'pending' | 'syncing' | 'synced' | 'failed'
  error?: string
}

const QUEUE_KEY = 'offline_queue'
const ONLINE_CHECK_INTERVAL = 5000 // Check every 5 seconds

/**
 * Hook to manage offline operations and sync when connection is restored
 */
export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true)
  const [queue, setQueue] = useState<OfflineOperation[]>([])
  const [syncing, setSyncing] = useState(false)

  // Initialize from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(QUEUE_KEY)
    if (stored) {
      setQueue(JSON.parse(stored))
    }

    // Set initial online status
    setIsOnline(navigator.onLine)
  }, [])

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  }, [queue])

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Trigger sync when connection returns
      syncQueue()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Periodic check as fallback
    const interval = setInterval(() => {
      const isCurrentlyOnline = navigator.onLine
      if (isCurrentlyOnline !== isOnline) {
        setIsOnline(isCurrentlyOnline)
        if (isCurrentlyOnline) {
          syncQueue()
        }
      }
    }, ONLINE_CHECK_INTERVAL)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [isOnline])

  /**
   * Add operation to queue
   */
  const addToQueue = (operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'status'>) => {
    const newOperation: OfflineOperation = {
      ...operation,
      id: `${operation.type}-${Date.now()}`,
      timestamp: Date.now(),
      status: 'pending',
    }

    setQueue((prev) => [...prev, newOperation])
    return newOperation.id
  }

  /**
   * Update operation status
   */
  const updateOperationStatus = (id: string, status: OfflineOperation['status'], error?: string) => {
    setQueue((prev) =>
      prev.map((op) =>
        op.id === id
          ? { ...op, status, error }
          : op
      )
    )
  }

  /**
   * Remove operation from queue (after successful sync)
   */
  const removeFromQueue = (id: string) => {
    setQueue((prev) => prev.filter((op) => op.id !== id))
  }

  /**
   * Sync all pending operations
   */
  const syncQueue = async () => {
    if (!isOnline || syncing || queue.length === 0) return

    setSyncing(true)

    for (const operation of queue.filter((op) => op.status === 'pending' || op.status === 'failed')) {
      try {
        updateOperationStatus(operation.id, 'syncing')

        // Send to server based on operation type
        const response = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: operation.type,
            data: operation.data,
          }),
        })

        if (response.ok) {
          updateOperationStatus(operation.id, 'synced')
          removeFromQueue(operation.id)
        } else {
          updateOperationStatus(operation.id, 'failed', `Server error: ${response.status}`)
        }
      } catch (error) {
        updateOperationStatus(
          operation.id,
          'failed',
          error instanceof Error ? error.message : 'Unknown error'
        )
      }
    }

    setSyncing(false)
  }

  return {
    isOnline,
    queue,
    syncing,
    addToQueue,
    updateOperationStatus,
    removeFromQueue,
    syncQueue,
  }
}

/**
 * Hook to show offline status and sync progress
 */
export function useOfflineStatus() {
  const [showOfflineNotice, setShowOfflineNotice] = useState(false)
  const { isOnline, queue, syncing } = useOfflineSync()

  useEffect(() => {
    setShowOfflineNotice(!isOnline)
  }, [isOnline])

  const pendingCount = queue.filter((op) => op.status === 'pending' || op.status === 'failed').length

  return {
    isOnline,
    showOfflineNotice,
    setShowOfflineNotice,
    pendingCount,
    isSyncing: syncing,
    hasPendingOperations: pendingCount > 0,
  }
}
