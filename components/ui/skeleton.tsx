import { cn } from '@/lib/utils'

interface SkeletonProps extends React.ComponentProps<'div'> {
  variant?: 'default' | 'text' | 'heading' | 'circle' | 'rect' | 'button' | 'card'
  animation?: 'shimmer' | 'pulse' | 'wave'
}

function Skeleton({ className, variant = 'default', animation = 'shimmer', ...props }: SkeletonProps) {
  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -1200px 0;
          }
          100% {
            background-position: 1200px 0;
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.65;
          }
        }
        
        @keyframes wave {
          0% {
            background-position: -1200px 0;
          }
          100% {
            background-position: 1200px 0;
          }
        }
        
        .skeleton-shimmer {
          animation: shimmer 2s ease-in-out infinite;
          background-size: 1200px 100%;
        }
        
        .skeleton-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .skeleton-wave {
          animation: wave 2s ease-in-out infinite;
          background-size: 1200px 100%;
        }
        
        /* Light mode */
        .light .skeleton-shimmer {
          background: linear-gradient(
            90deg,
            hsl(var(--muted)) 0%,
            hsl(var(--muted) / 0.5) 15%,
            hsl(var(--muted)) 30%,
            hsl(var(--muted)) 100%
          );
        }
        
        /* Dark mode */
        .dark .skeleton-shimmer {
          background: linear-gradient(
            90deg,
            hsl(var(--muted)) 0%,
            hsl(var(--muted) / 0.8) 15%,
            hsl(var(--muted)) 30%,
            hsl(var(--muted)) 100%
          );
        }
        
        /* Wave animation for both modes */
        .light .skeleton-wave,
        .dark .skeleton-wave {
          background: linear-gradient(
            90deg,
            hsl(var(--muted)) 0%,
            hsl(var(--muted) / 0.8) 20%,
            hsl(var(--muted) / 0.5) 40%,
            hsl(var(--muted)) 100%
          );
        }
      `}</style>
      <div
        data-slot="skeleton"
        className={cn(
          'bg-muted rounded-lg',
          animation === 'shimmer' && 'skeleton-shimmer',
          animation === 'pulse' && 'skeleton-pulse',
          animation === 'wave' && 'skeleton-wave',
          variant === 'text' && 'h-4 w-full',
          variant === 'heading' && 'h-6 w-3/4',
          variant === 'circle' && 'h-12 w-12 rounded-full',
          variant === 'rect' && 'h-32 w-full',
          variant === 'button' && 'h-10 w-32',
          variant === 'card' && 'h-48 w-full',
          className,
        )}
        {...props}
      />
    </>
  )
}

export { Skeleton }

