import { Skeleton } from "@/components/ui/skeleton"

interface FormSkeletonProps {
  fields?: number
  columns?: number
}

export function FormSkeleton({ fields = 6, columns = 2 }: FormSkeletonProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton variant="text" className="h-4 w-24" />
            <Skeleton variant="button" className="h-10 w-full rounded-md" />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Skeleton variant="button" className="h-10 w-32" />
        <Skeleton variant="button" className="h-10 w-20" />
      </div>
    </div>
  )
}
