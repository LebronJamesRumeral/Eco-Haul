"use client"

import { Bell, User, Home, Sun, Moon, Truck, Users, MapPin, DollarSign, ClipboardCheck, BarChart3, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { logout } from "@/lib/auth"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

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
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            disabled={!mounted}
          >
            {mounted && theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </Button>

          <Button variant="ghost" size="icon" className="text-foreground hover:bg-primary/10 hover:text-primary focus-visible:ring-primary/50">
            <Bell size={18} />
          </Button>

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
