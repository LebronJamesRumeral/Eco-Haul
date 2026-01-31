import { Skeleton } from "@/components/ui/skeleton"

interface ChartSkeletonProps {
  height?: string
}

export function ChartSkeleton({ height = "h-64" }: ChartSkeletonProps) {
  return (
    <div className="bg-gradient-to-br from-card to-card/50 rounded-xl border border-border/30 backdrop-blur-sm p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-48 rounded-md bg-muted/50" />
          <Skeleton className="h-4 w-64 rounded-md bg-muted/50" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-lg bg-muted/50" />
          <Skeleton className="h-8 w-8 rounded-lg bg-muted/50" />
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full bg-muted/50" />
            <Skeleton className="h-3 w-16 rounded-md bg-muted/50" />
          </div>
        ))}
      </div>

      {/* Chart Area */}
      <div className={`${height} w-full rounded-lg bg-gradient-to-br from-muted/20 to-muted/10 p-4 flex items-end gap-2`}>
        {Array.from({ length: 12 }).map((_, i) => {
          const heights = ['h-1/4', 'h-1/3', 'h-1/2', 'h-2/3', 'h-3/4', 'h-full']
          const randomHeight = heights[Math.floor(Math.random() * heights.length)]
          return (
            <Skeleton 
              key={i} 
              className={`flex-1 ${randomHeight} rounded-t-md bg-muted/50`} 
            />
          )
        })}
      </div>
    </div>
  )
}
