import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { HeaderSkeleton } from "@/components/loading/header-skeleton"
import { StatCardSkeleton } from "@/components/loading/stat-card-skeleton"
import { ChartSkeleton } from "@/components/loading/chart-skeleton"
import { TableSkeleton } from "@/components/loading/table-skeleton"

export default function Loading() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <HeaderSkeleton />

        <StatCardSkeleton count={6} />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>

        <Card className="bg-card border-border/30">
          <CardHeader className="space-y-3">
            <HeaderSkeleton />
          </CardHeader>
          <CardContent>
            <TableSkeleton columns={5} rows={5} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
