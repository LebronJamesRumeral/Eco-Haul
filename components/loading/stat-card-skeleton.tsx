import { Skeleton } from "@/components/ui/skeleton"

interface StatCardSkeletonProps {
  count?: number
}

export function StatCardSkeleton({ count = 6 }: StatCardSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border/30 bg-card p-4 space-y-3">
          <Skeleton variant="text" className="h-3 w-28" animation="pulse" />
          <Skeleton variant="heading" className="h-7 w-16" />
          <Skeleton variant="text" className="h-3 w-32" />
        </div>
      ))}
    </div>
  )
}
