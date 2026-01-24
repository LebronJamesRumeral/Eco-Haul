import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { HeaderSkeleton } from "@/components/loading/header-skeleton"
import { FormSkeleton } from "@/components/loading/form-skeleton"
import { TableSkeleton } from "@/components/loading/table-skeleton"

export default function Loading() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <HeaderSkeleton />

        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <HeaderSkeleton />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <HeaderSkeleton />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/30">
          <CardHeader className="space-y-3">
            <HeaderSkeleton />
          </CardHeader>
          <CardContent>
            <FormSkeleton fields={6} columns={2} />
          </CardContent>
        </Card>

        <Card className="bg-card border-border/30">
          <CardHeader className="space-y-3">
            <HeaderSkeleton />
          </CardHeader>
          <CardContent>
            <TableSkeleton columns={6} rows={5} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
