"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RootPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Always redirect to login from root path
    router.push('/login')
  }, [router])

  return null
}
