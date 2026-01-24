import { Skeleton } from "@/components/ui/skeleton"

interface CardSkeletonProps {
  lines?: number
  withImage?: boolean
  withButton?: boolean
}

export function CardSkeleton({ lines = 3, withImage = true, withButton = false }: CardSkeletonProps) {
  return (
    <div className="space-y-4">
      {withImage && <Skeleton variant="rect" className="h-40" />}
      <div className="space-y-3 p-4">
        <Skeleton variant="heading" className="w-2/3" />
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} variant="text" className={i === lines - 1 ? "w-4/5" : "w-full"} />
        ))}
        {withButton && (
          <div className="pt-2">
            <Skeleton variant="button" className="w-24" />
          </div>
        )}
      </div>
    </div>
  )
}
