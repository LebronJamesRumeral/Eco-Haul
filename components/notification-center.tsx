"use client"

import { useState } from "react"
import { useNotifications } from "@/hooks/use-notifications"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Bell, X, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export function NotificationCenter() {
  const {
    notifications,
    badge,
    notificationPermission,
    requestPermission,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll,
  } = useNotifications()

  const [isOpen, setIsOpen] = useState(false)
  const unreadCount = notifications.filter((n) => !n.read).length

  const handleRequestPermission = async () => {
    await requestPermission()
  }

  const getIconForType = (type: string) => {
    switch (type) {
      case 'trip':
        return '🚚'
      case 'driver':
        return '👤'
      case 'payroll':
        return '💰'
      case 'system':
        return '⚙️'
      default:
        return '📢'
    }
  }

  return (
    <div className="fixed top-4 right-4 z-40">
      {/* Notification Bell Button */}
      <div className="relative">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="relative h-10 w-10 rounded-full border-slate-200 dark:border-slate-700"
        >
          <Bell className="h-5 w-5" />
          {badge > 0 && (
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </Button>
      </div>

      {/* Notification Panel */}
      {isOpen && (
        <Card className="absolute right-0 top-12 w-96 max-w-[calc(100vw-32px)] rounded-xl border-slate-200 shadow-2xl dark:border-slate-700 bg-white dark:bg-slate-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-slate-900 dark:text-white" />
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                  {unreadCount}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Notification Permission Request */}
          {notificationPermission !== 'granted' && (
            <div className="border-b border-slate-200 dark:border-slate-700 bg-blue-50 dark:bg-blue-900/20 p-3">
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">
                Enable notifications to get trip and payroll alerts
              </p>
              <Button
                size="sm"
                onClick={handleRequestPermission}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs"
              >
                Enable Notifications
              </Button>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No notifications yet
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                      !notification.read
                        ? 'bg-blue-50 dark:bg-blue-900/10'
                        : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 text-lg">
                        {getIconForType(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm text-slate-900 dark:text-white">
                            {notification.title}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => clearNotification(notification.id)}
                            className="h-5 w-5 -mr-1"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          {notification.body}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                          {formatDistanceToNow(notification.timestamp, {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-700 p-3 flex gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="flex-1 text-xs"
                >
                  Mark all as read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="flex-1 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear all
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
