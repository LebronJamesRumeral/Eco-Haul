import { Skeleton } from "@/components/ui/skeleton"

interface TableSkeletonProps {
  columns?: number
  rows?: number
}

export function TableSkeleton({ columns = 5, rows = 8 }: TableSkeletonProps) {
  return (
    <div className="w-full rounded-xl border border-border/30 overflow-hidden bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
      {/* Header */}
      <div className="grid gap-4 px-5 py-4 bg-muted/30 border-b border-border/30" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-4 w-20 rounded-md bg-muted/60" />
        ))}
      </div>
      {/* Rows */}
      <div className="divide-y divide-border/20">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div 
            key={`row-${rowIdx}`} 
            className="grid gap-4 px-5 py-4 hover:bg-muted/10 transition-colors" 
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }).map((_, colIdx) => {
              // Vary skeleton widths for more realistic appearance
              const widthClass = colIdx === 0 ? "w-full" : colIdx === columns - 1 ? "w-16" : colIdx % 2 === 0 ? "w-3/4" : "w-full"
              return (
                <Skeleton 
                  key={`cell-${rowIdx}-${colIdx}`} 
                  className={`h-4 rounded-md bg-muted/50 ${widthClass}`} 
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
