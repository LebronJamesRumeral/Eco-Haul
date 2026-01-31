import { Skeleton } from "@/components/ui/skeleton"

interface CardSkeletonProps {
  lines?: number
  withImage?: boolean
  withButton?: boolean
}

export function CardSkeleton({ lines = 3, withImage = true, withButton = false }: CardSkeletonProps) {
  return (
    <div className="bg-gradient-to-br from-card to-card/50 rounded-xl border border-border/30 backdrop-blur-sm overflow-hidden">
      {withImage && (
        <div className="h-40 bg-gradient-to-br from-muted/50 to-muted/30">
          <Skeleton className="h-full w-full bg-muted/50" />
        </div>
      )}
      <div className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-2/3 rounded-md bg-muted/50" />
          <Skeleton className="h-4 w-4 rounded bg-muted/50" />
        </div>
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton 
            key={i} 
            className={`h-4 rounded-md bg-muted/50 ${i === lines - 1 ? "w-4/5" : "w-full"}`} 
          />
        ))}
        {withButton && (
          <div className="pt-3 flex gap-2">
            <Skeleton className="h-9 w-24 rounded-lg bg-muted/50" />
            <Skeleton className="h-9 w-20 rounded-lg bg-muted/50" />
          </div>
        )}
      </div>
    </div>
  )
}
