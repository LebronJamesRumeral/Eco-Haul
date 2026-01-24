import { supabase } from './supabase'

export type UserRole = 'admin' | 'driver' | 'supervisor'

export interface AuthUser {
  id: number
  email: string
  role: UserRole
  driver_id?: number
}

export interface AuthSession {
  user: AuthUser
  token: string
}

// Simple password hashing (use bcrypt in production)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}

// Login function
export async function login(email: string, password: string): Promise<AuthSession> {
  const passwordHash = await hashPassword(password)
  
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, role, driver_id')
    .eq('email', email)
    .eq('password_hash', passwordHash)
    .single()
  
  if (error || !user) {
    throw new Error('Invalid email or password')
  }
  
  const token = btoa(JSON.stringify({ id: user.id, email: user.email, role: user.role }))
  
  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      driver_id: user.driver_id
    },
    token
  }
}

// Get current session from localStorage
export function getSession(): AuthSession | null {
  if (typeof window === 'undefined') return null
  
  const sessionStr = localStorage.getItem('auth_session')
  if (!sessionStr) return null
  
  try {
    return JSON.parse(sessionStr) as AuthSession
  } catch {
    return null
  }
}

// Save session to localStorage
export function saveSession(session: AuthSession): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('auth_session', JSON.stringify(session))
}

// Clear session from localStorage
export function clearSession(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('auth_session')
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return getSession() !== null
}

// Get current user
export function getCurrentUser(): AuthUser | null {
  const session = getSession()
  return session?.user || null
}

// Check if user has role
export function hasRole(role: UserRole): boolean {
  const user = getCurrentUser()
  return user?.role === role
}

// Logout
export function logout(): void {
  clearSession()
}
