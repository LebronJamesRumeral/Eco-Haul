"use client"

import { Bell, User, Home, Sun, Moon, Truck, Users, MapPin, DollarSign, ClipboardCheck, BarChart3, Settings, X, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { logout } from "@/lib/auth"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { useNotifications } from "@/hooks/use-notifications"
import { Card } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState<string>("")
  const {
    notifications,
    requestPermission,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll,
  } = useNotifications()

  useEffect(() => setMounted(true), [])

  const handleRequestPermission = async () => {
    try {
      setPermissionStatus("Requesting...")
      const result = await requestPermission()
      if (result) {
        setPermissionStatus("Granted! You will now receive notifications")
        setTimeout(() => setPermissionStatus(""), 3000)
      } else {
        setPermissionStatus("Permission denied. Check your browser settings.")
        setTimeout(() => setPermissionStatus(""), 3000)
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error)
      setPermissionStatus("Error requesting permission")
      setTimeout(() => setPermissionStatus(""), 3000)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  // Get the actual theme being used (resolves 'system' to 'light' or 'dark')
  const currentTheme = mounted ? resolvedTheme : 'light'

  const getPageTitle = () => {
    const segments = pathname.split("/").filter(Boolean)
    if (segments.length === 0) return "Dashboard"
    return segments[0].charAt(0).toUpperCase() + segments[0].slice(1)
  }

  const getPageIcon = () => {
    const segments = pathname.split("/").filter(Boolean)
    const page = segments[0] || "dashboard"
    
    switch (page) {
      case "dashboard":
        return <Home size={18} />
      case "trucks":
        return <Truck size={18} />
      case "drivers":
        return <Users size={18} />
      case "trips":
        return <MapPin size={18} />
      case "billing":
        return <DollarSign size={18} />
      case "compliance":
        return <ClipboardCheck size={18} />
      case "reports":
        return <BarChart3 size={18} />
      case "settings":
        return <Settings size={18} />
      default:
        return <Home size={18} />
    }
  }

  return (
    <header className="sticky top-0 z-20 backdrop-blur-xl bg-gradient-to-r from-card/95 via-card/90 to-card/85 border-b-2 border-primary/30 px-4 py-3 sm:px-6 lg:px-10 shadow-md">
      <div className="flex items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/40 via-primary/20 to-primary/10 text-primary grid place-items-center ring-2 ring-primary/60 shadow-lg">
            {getPageIcon()}
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Current View</span>
            <h2 className="text-lg font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">{getPageTitle()}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-foreground hover:bg-primary/10 hover:text-primary focus-visible:ring-primary/50"
            onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            disabled={!mounted}
          >
            {currentTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </Button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="text-foreground hover:bg-primary/10 hover:text-primary focus-visible:ring-primary/50 relative"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              aria-label="Notifications"
            >
              <Bell size={18} />
              {notifications.filter((n) => !n.read).length > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {notifications.filter((n) => !n.read).length}
                </span>
              )}
            </Button>

            {/* Notification Panel */}
            {notificationsOpen && (
              <div className="absolute top-12 right-0 w-80 z-50">
                <Card className="shadow-xl border-2 border-primary/20 rounded-lg bg-card">
                  <div className="p-4 border-b border-border flex justify-between items-center bg-card">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    <div className="flex gap-2">
                      {notifications.length > 0 && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              markAllAsRead()
                            }}
                            className="text-xs h-7"
                          >
                            Mark all read
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              clearAll()
                            }}
                            className="text-xs h-7 text-red-500 hover:text-red-600"
                          >
                            Clear all
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setNotificationsOpen(false)}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto bg-card">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground bg-card">
                        <div className="text-3xl mb-2">🔔</div>
                        <p className="text-sm">No notifications yet</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRequestPermission()}
                          className="mt-3"
                        >
                          Enable notifications
                        </Button>
                        {permissionStatus && (
                          <p className="text-xs mt-2 text-primary">{permissionStatus}</p>
                        )}
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 border-b border-border last:border-b-0 ${
                            notification.read ? "bg-background/50" : "bg-primary/5"
                          } hover:bg-primary/10 transition-colors cursor-pointer group`}
                          onClick={() => {
                            if (!notification.read) {
                              markAsRead(notification.id)
                            }
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">
                                  {notification.type === "trip"
                                    ? "🚚"
                                    : notification.type === "driver"
                                    ? "👤"
                                    : notification.type === "payroll"
                                    ? "💰"
                                    : "⚙️"}
                                </span>
                                <p className="text-sm font-semibold text-foreground">
                                  {notification.title}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground/70 mt-1">
                                {formatDistanceToNow(new Date(notification.timestamp), {
                                  addSuffix: true,
                                })}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                clearNotification(notification.id)
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 border-primary/40 hover:border-primary/70 hover:bg-primary/5">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/40 to-primary/20 text-primary grid place-items-center text-xs font-bold shadow-md">
                  {user?.email?.[0]?.toUpperCase() || "U"}
                </div>
                <span className="hidden sm:inline text-sm font-semibold">{user?.email || "Account"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                {user?.email}
              </DropdownMenuItem>
              <DropdownMenuItem>Account Settings</DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
