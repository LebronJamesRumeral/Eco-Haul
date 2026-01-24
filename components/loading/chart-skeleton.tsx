import { Skeleton } from "@/components/ui/skeleton"

interface ChartSkeletonProps {
  height?: string
}

export function ChartSkeleton({ height = "h-64" }: ChartSkeletonProps) {
  return (
    <div className="rounded-lg border border-border/30 bg-card p-6 space-y-4">
      <div className="space-y-2">
        <Skeleton variant="heading" className="h-5 w-48" animation="pulse" />
        <Skeleton variant="text" className="h-3 w-64" />
      </div>
      <Skeleton className={`${height} w-full rounded-lg`} animation="wave" />
    </div>
  )
}
