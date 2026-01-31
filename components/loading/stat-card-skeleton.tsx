import { Skeleton } from "@/components/ui/skeleton"

interface StatCardSkeletonProps {
  count?: number
}

export function StatCardSkeleton({ count = 6 }: StatCardSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-gradient-to-br from-card to-card/50 rounded-xl p-5 border border-border/30 backdrop-blur-sm space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-20 rounded-md bg-muted/50" />
            <Skeleton className="h-3 w-3 rounded-full bg-muted/50" />
          </div>
          <Skeleton className="h-9 w-24 rounded-md bg-muted/50" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full bg-muted/50" />
            <Skeleton className="h-3 w-16 rounded-md bg-muted/50" />
          </div>
        </div>
      ))}
    </div>
  )
}
