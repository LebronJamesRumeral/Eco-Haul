import { DashboardLayout } from "@/components/dashboard-layout"
import { HeaderSkeleton } from "@/components/loading/header-skeleton"
import { CardSkeleton } from "@/components/loading/card-skeleton"

export default function Loading() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <HeaderSkeleton />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border/30 bg-card overflow-hidden">
              <CardSkeleton withImage={true} lines={2} />
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
