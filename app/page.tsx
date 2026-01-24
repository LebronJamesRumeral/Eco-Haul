"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RootPage() {
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
    // Redirect to login only after hydration
    const timer = setTimeout(() => {
      router.push('/login')
    }, 0)
    return () => clearTimeout(timer)
  }, [router])

  return isClient ? null : null
}
