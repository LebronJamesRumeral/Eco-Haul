"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Truck, Users, Map, DollarSign, CheckCircle, BarChart3, Settings, Menu, X, Navigation } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import Image from "next/image"

const adminNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
  { icon: Truck, label: "Trucks", href: "/trucks" },
  { icon: Users, label: "Drivers", href: "/drivers" },
  { icon: Map, label: "Trip Monitoring", href: "/trips" },
  { icon: Navigation, label: "GPS Tracking", href: "/gps-tracking" },
  { icon: DollarSign, label: "Billing & Payroll", href: "/billing" },
  { icon: CheckCircle, label: "Cleanup Compliance", href: "/compliance" },
  { icon: BarChart3, label: "Reports", href: "/reports" },
  { icon: Settings, label: "Settings", href: "/settings" },
]

const driverNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/driver/dashboard" },
  { icon: Map, label: "My Trips", href: "/trips" },
  { icon: CheckCircle, label: "Cleanup Compliance", href: "/driver/compliance" },
]

export function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(true)
  const { isAdmin, isDriver, user } = useAuth()

  const navItems = isAdmin ? adminNavItems : driverNavItems

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-40 lg:hidden bg-sidebar-primary text-sidebar-primary-foreground p-2 rounded-lg shadow-lg"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 lg:translate-x-0 z-30 shadow-2xl",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo */}
        <div className="h-20 flex items-center gap-3 border-b border-sidebar-border px-4">
          <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-white flex-shrink-0">
            <Image
              src="/pristine.jpg"
              alt="EcoHaul Logo"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-[0.2em] text-sidebar-foreground/60">EcoHaul</p>
            <h1 className="text-xl font-semibold text-sidebar-foreground">Operations</h1>
          </div>
          <span className="text-[10px] px-2 py-1 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex-shrink-0">Live</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-gradient-to-r from-[var(--primary)] to-[color-mix(in srgb,var(--primary) 80%,black)] text-primary-foreground ring-2 ring-[var(--ring)] shadow-lg shadow-[color-mix(in_srgb,var(--primary)_40%,transparent)]"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-primary hover:ring-1 hover:ring-[var(--ring)]",
                )}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          <p className="text-xs text-sidebar-foreground/60">{isAdmin ? 'Admin Panel' : 'Driver Account'}</p>
          <p className="text-xs text-sidebar-foreground/50 mt-1 truncate">{user?.email}</p>
        </div>
      </div>

      {/* Overlay for mobile */}
      {open && <div onClick={() => setOpen(false)} className="fixed inset-0 bg-black/50 z-20 lg:hidden" />}
    </>
  )
}
