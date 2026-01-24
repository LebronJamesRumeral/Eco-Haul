import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { HeaderSkeleton } from "@/components/loading/header-skeleton"
import { CardSkeleton } from "@/components/loading/card-skeleton"

export default function Loading() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <HeaderSkeleton />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card border-border/30 md:col-span-1">
            <CardHeader className="space-y-3">
              <HeaderSkeleton />
            </CardHeader>
            <CardContent>
              <CardSkeleton lines={3} withImage={false} />
            </CardContent>
          </Card>
          <Card className="bg-card border-border/30 md:col-span-2">
            <CardHeader className="space-y-3">
              <HeaderSkeleton />
            </CardHeader>
            <CardContent>
              <CardSkeleton lines={5} withImage={false} />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
