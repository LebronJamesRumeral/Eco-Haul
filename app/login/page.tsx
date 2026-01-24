'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { login, saveSession, type UserRole } from '@/lib/auth'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('driver')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const session = await login(email, password)
      
      // Verify role matches
      if (session.user.role !== role) {
        throw new Error(`This account is registered as an ${session.user.role}, not a ${role}`)
      }
      
      saveSession(session)
      
      // Redirect based on role
      if (role === 'admin') {
        router.push('/admin/dashboard')
      } else {
        router.push('/driver/dashboard')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className=\"relative min-h-screen overflow-hidden bg-background\" suppressHydrationWarning>
      <div className=\"pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/10 to-transparent\" aria-hidden=\"true\" />
      <div className=\"absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,rgba(22,163,74,0.18),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.15),transparent_32%)]\" aria-hidden=\"true\" />

      <div className="relative z-10 grid min-h-screen items-center px-4 py-10 lg:grid-cols-2 lg:px-12">
        <div className="hidden lg:block pr-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-white shadow-lg">
              <Image
                src="/pristine.jpg"
                alt="EcoHaul Logo"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary">EcoHaul Platform</p>
              <p className="text-xs text-muted-foreground">Mining Operations Dashboard</p>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground leading-tight mb-4">Monitor fleets, drivers, and trips with clarity.</h1>
          <p className="text-muted-foreground text-lg max-w-xl">Live GPS tracking, trip workflows, and compliance in one dashboard. Optimized for low-light cabs and bright field tablets with automatic dark/light themes.</p>
          <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl border border-border/70 bg-card/60 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Drivers</p>
              <p className="text-2xl font-semibold text-foreground mt-1">Live GPS + Trips</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card/60 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Admins</p>
              <p className="text-2xl font-semibold text-foreground mt-1">Billing + Compliance</p>
            </div>
          </div>
        </div>

        <div className="flex w-full justify-center">
          <Card className="w-full max-w-md border-border/70 shadow-2xl backdrop-blur">
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-white">
                  <Image
                    src="/pristine.jpg"
                    alt="EcoHaul Logo"
                    fill
                    className="object-cover"
                  />
                </div>
                <CardTitle className="text-2xl">EcoHaul Login</CardTitle>
              </div>
              <CardDescription>Choose your role, then sign in to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ label: 'Driver', value: 'driver' }, { label: 'Admin', value: 'admin' }].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setRole(option.value as UserRole)}
                        className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                          role === option.value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-foreground hover:border-primary/50'
                        }`}
                      >
                        <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="driver@ecohual.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </Button>

                <div className="mt-6 p-4 bg-muted/80 rounded-lg text-sm border border-border/70">
                  <p className="font-semibold mb-2">Demo Credentials:</p>
                  <div className="space-y-2 text-xs">
                    <p><strong>Admin:</strong> admin@ecohual.com / password123</p>
                    <p><strong>Driver:</strong> driver1@ecohual.com / password123</p>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
