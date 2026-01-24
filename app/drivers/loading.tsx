import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { HeaderSkeleton } from "@/components/loading/header-skeleton"
import { TableSkeleton } from "@/components/loading/table-skeleton"

export default function Loading() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <HeaderSkeleton />

        <Card className="bg-card border-border/30">
          <CardHeader className="space-y-3">
            <HeaderSkeleton />
          </CardHeader>
          <CardContent>
            <TableSkeleton columns={5} rows={8} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
