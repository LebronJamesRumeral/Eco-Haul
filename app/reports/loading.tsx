import { DashboardLayout } from "@/components/dashboard-layout"
import { HeaderSkeleton } from "@/components/loading/header-skeleton"
import { ChartSkeleton } from "@/components/loading/chart-skeleton"

export default function Loading() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <HeaderSkeleton />

        <ChartSkeleton height="h-72" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartSkeleton height="h-56" />
          <ChartSkeleton height="h-56" />
        </div>
      </div>
    </DashboardLayout>
  )
}
