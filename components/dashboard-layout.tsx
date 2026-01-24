import type React from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background text-foreground lg:pl-64">
      <Sidebar />
      <div className="flex min-h-screen flex-col backdrop-blur-sm bg-background/70">
        <Header />
        <main className="flex-1 overflow-auto px-4 py-6 sm:px-6 lg:px-10">{children}</main>
      </div>
    </div>
  )
}
