'use client'

import { useEffect, useState } from 'react'
import { getSession, getCurrentUser, logout as logoutAuth, clearSession, type AuthUser, type UserRole } from '@/lib/auth'

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get user from session on mount
    const currentUser = getCurrentUser()
    setUser(currentUser)
    setLoading(false)
  }, [])

  const logout = () => {
    logoutAuth()
    setUser(null)
  }

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role
  }

  const isAuthenticated = (): boolean => {
    return user !== null
  }

  return {
    user,
    loading,
    logout,
    hasRole,
    isAuthenticated,
    isAdmin: user?.role === 'admin',
    isDriver: user?.role === 'driver',
    isSupervisor: user?.role === 'supervisor'
  }
}
