import { DashboardLayout } from "@/components/dashboard-layout"
import { HeaderSkeleton } from "@/components/loading/header-skeleton"
import { CardSkeleton } from "@/components/loading/card-skeleton"
import { StatCardSkeleton } from "@/components/loading/stat-card-skeleton"

export default function Loading() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <HeaderSkeleton />

        <div className="rounded-lg border border-border/30 bg-card p-6">
          <CardSkeleton lines={4} withImage={false} withButton={true} />
        </div>

        <StatCardSkeleton count={4} />
      </div>
    </DashboardLayout>
  )
}
