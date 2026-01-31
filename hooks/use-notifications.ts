import { useEffect, useState } from 'react'

export interface AppNotification {
  id: string
  title: string
  body: string
  type: 'trip' | 'driver' | 'payroll' | 'system'
  data?: {
    driverId?: number
    tripId?: number
    driverName?: string
    truckNumber?: string
    action?: string
  }
  timestamp: number
  read: boolean
}

const NOTIFICATIONS_KEY = 'app_notifications'
const NOTIFICATION_PERMISSION_KEY = 'notification_permission_asked'

/**
 * Hook to manage app notifications and push notifications
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [badge, setBadge] = useState(0)

  // Initialize from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(NOTIFICATIONS_KEY)
    if (stored) {
      setNotifications(JSON.parse(stored))
    }

    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  // Save notifications to localStorage and update badge
  useEffect(() => {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications))
    
    // Update badge count
    const unreadCount = notifications.filter(n => !n.read).length
    setBadge(unreadCount)
    
    // Update app badge if API available
    if ('setAppBadge' in navigator) {
      if (unreadCount > 0) {
        (navigator as any).setAppBadge(unreadCount)
      } else {
        (navigator as any).clearAppBadge()
      }
    }
  }, [notifications])

  /**
   * Request notification permission
   */
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.log('Notifications not supported')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      
      if (permission === 'granted') {
        // Register service worker for push notifications
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready
          // Subscribe to push notifications if available
          if ('pushManager' in registration) {
            try {
              const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
              })
              console.log('Push subscription:', subscription)
            } catch (error) {
              console.log('Push subscription not available:', error)
            }
          }
        }
      }

      localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'true')
      return permission === 'granted'
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }

  /**
   * Add a new notification
   */
  const addNotification = (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: AppNotification = {
      ...notification,
      id: `${notification.type}-${Date.now()}`,
      timestamp: Date.now(),
      read: false,
    }

    setNotifications((prev) => [newNotification, ...prev])

    // Show push notification if permission granted
    if (notificationPermission === 'granted') {
      showPushNotification(newNotification)
    }

    return newNotification.id
  }

  /**
   * Show push notification
   */
  const showPushNotification = (notification: AppNotification) => {
    if (!('Notification' in window)) return

    const options: NotificationOptions = {
      body: notification.body,
      icon: '/pristine.jpg',
      badge: '/icon-192x192.png',
      tag: notification.type, // Group notifications by type
      requireInteraction: notification.type === 'payroll', // Keep payroll notifications visible
      data: notification.data,
    }

    try {
      new Notification(notification.title, options)
    } catch (error) {
      console.error('Error showing notification:', error)
    }
  }

  /**
   * Mark notification as read
   */
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  /**
   * Mark all as read
   */
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  /**
   * Clear notification
   */
  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  /**
   * Clear all notifications
   */
  const clearAll = () => {
    setNotifications([])
  }

  /**
   * Send trip notification
   */
  const notifyTripStarted = (driverName: string, truckNumber: string) => {
    addNotification({
      type: 'trip',
      title: '🚚 Trip Started',
      body: `${driverName} started trip with ${truckNumber}`,
      data: { driverName, truckNumber, action: 'started' },
    })
  }

  /**
   * Send trip completion notification
   */
  const notifyTripCompleted = (driverName: string, truckNumber: string, distance: number) => {
    addNotification({
      type: 'trip',
      title: '✅ Trip Completed',
      body: `${driverName} completed ${distance}km trip with ${truckNumber}`,
      data: { driverName, truckNumber, action: 'completed' },
    })
  }

  /**
   * Send driver notification
   */
  const notifyDriver = (driverName: string, message: string) => {
    addNotification({
      type: 'driver',
      title: '👤 Driver Update',
      body: `${driverName}: ${message}`,
      data: { driverName },
    })
  }

  /**
   * Send payroll notification
   */
  const notifyPayroll = (driverName: string, amount: number) => {
    addNotification({
      type: 'payroll',
      title: '💰 Payroll Updated',
      body: `${driverName} earned ₱${amount.toLocaleString()}`,
      data: { driverName },
    })
  }

  return {
    notifications,
    badge,
    notificationPermission,
    requestPermission,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll,
    notifyTripStarted,
    notifyTripCompleted,
    notifyDriver,
    notifyPayroll,
  }
}
