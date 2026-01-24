import { Skeleton } from "@/components/ui/skeleton"

export function HeaderSkeleton() {
  return (
    <div className="space-y-2 pb-4 border-b border-border/30">
      <Skeleton variant="text" className="h-3 w-32" animation="pulse" />
      <Skeleton variant="heading" className="h-8 w-96" />
      <Skeleton variant="text" className="h-4 w-full max-w-lg" />
    </div>
  )
}
