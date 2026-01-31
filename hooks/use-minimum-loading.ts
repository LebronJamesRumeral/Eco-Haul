import { useEffect, useState } from 'react'

/**
 * Hook to ensure a minimum loading time for better UX
 * Even if data loads quickly, skeleton will be shown for at least minDuration ms
 */
export function useMinimumLoading(
  actualLoading: boolean,
  minDuration: number = 800
): boolean {
  const [isLoading, setIsLoading] = useState(true)
  const [startTime] = useState(() => Date.now())

  useEffect(() => {
    if (!actualLoading) {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, minDuration - elapsed)
      
      if (remaining > 0) {
        const timer = setTimeout(() => {
          setIsLoading(false)
        }, remaining)
        return () => clearTimeout(timer)
      } else {
        setIsLoading(false)
      }
    }
  }, [actualLoading, minDuration, startTime])

  return actualLoading || isLoading
}
