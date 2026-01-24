import type React from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background text-foreground lg:pl-64">
      {/* Dynamic gradient background */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-gradient-to-br from-background via-background to-primary/5 pointer-events-none" />
      <Sidebar />
      <div className="flex min-h-screen flex-col backdrop-blur-md bg-gradient-to-b from-background/80 to-background">
        <Header />
        <main className="flex-1 overflow-auto px-4 py-6 sm:px-6 lg:px-10 bg-gradient-to-b from-transparent to-primary/[0.02]">{children}</main>
      </div>
    </div>
  )
}
