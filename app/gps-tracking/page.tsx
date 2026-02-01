'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useDriverLocations, useToggleTracking } from '@/hooks/use-supabase-data'
import { getAllDriverPaths } from '@/hooks/use-driver-paths'
import { GPSMapView } from '@/components/gps-map-view'
import { MapPin, Navigation, Clock, CheckCircle2, AlertCircle, Route } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

export default function GPSTrackingPage() {
  const router = useRouter()
  const { user, loading: authLoading, isAdmin } = useAuth()
  const { locations, loading, error } = useDriverLocations()
  const { toggleTracking, updating } = useToggleTracking()
  const [driverPaths, setDriverPaths] = useState<any[]>([])
  const [loadingPaths, setLoadingPaths] = useState(true)
  const [showPaths, setShowPaths] = useState(true)

  // Fetch driver paths with GPS locations
  useEffect(() => {
    async function fetchPaths() {
      setLoadingPaths(true)
      try {
        const paths = await getAllDriverPaths()
        setDriverPaths(paths)
      } catch (err) {
        console.error('Error fetching driver paths:', err)
      } finally {
        setLoadingPaths(false)
      }
    }

    fetchPaths()
    
    // Refresh paths every 30 seconds
    const interval = setInterval(fetchPaths, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/login')
    }
  }, [authLoading, user, isAdmin, router])

  const handleToggleTracking = async (driverId: number, currentStatus: boolean) => {
    await toggleTracking(driverId, !currentStatus)
    // Refresh page to show updated status
    window.location.reload()
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  const getTimeAgo = (secondsAgo: number) => {
    if (secondsAgo < 60) return `${Math.floor(secondsAgo)}s ago`
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`
    return `${Math.floor(secondsAgo / 3600)}h ago`
  }

  const getStatusColor = (secondsAgo: number, trackingEnabled: boolean) => {
    if (!trackingEnabled) return 'gray'
    if (secondsAgo < 120) return 'green' // Less than 2 minutes
    if (secondsAgo < 600) return 'yellow' // Less than 10 minutes
    return 'red' // More than 10 minutes
  }

  const activeLocations = locations.filter(loc => loc.tracking_enabled)

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">GPS Tracking</h1>
            <p className="text-muted-foreground">Monitor driver locations in real-time</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{locations.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Now</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(driverPaths.map(p => p.driver_id)).size}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tracking Enabled</CardTitle>
              <Navigation className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {locations.filter(loc => loc.tracking_enabled).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {locations.filter(loc => loc.seconds_since_update >= 600 || !loc.tracking_enabled).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Map with Paths */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Route className="h-5 w-5" />
                  Live GPS Tracking with Routes
                </CardTitle>
                <CardDescription>
                  Each driver has a unique color showing their traveled path and current location
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPaths(!showPaths)}
                className="w-fit"
              >
                {showPaths ? 'Hide Paths' : 'Show Paths'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingPaths ? (
              <div className="rounded-lg bg-muted animate-pulse" style={{ height: '500px' }} />
            ) : driverPaths.length === 0 ? (
              <div className="text-center py-12 border border-border rounded-lg">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No GPS data available</p>
                <p className="text-sm text-muted-foreground">Drivers will appear here once they start tracking</p>
              </div>
            ) : (
              <GPSMapView 
                driverLocations={driverPaths} 
                showPaths={showPaths}
                height="500px"
              />
            )}
          </CardContent>
        </Card>

        {/* Driver Location List */}
        <Card>
          <CardHeader>
            <CardTitle>Driver Locations</CardTitle>
            <CardDescription>Current location status and tracking controls</CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
                <p className="text-lg font-medium">Failed to load locations</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            ) : activeLocations.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No drivers with tracking on</p>
                <p className="text-sm text-muted-foreground">Turn tracking on to see active drivers here</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Driver</TableHead>
                    <TableHead>Truck</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Accuracy</TableHead>
                    <TableHead>Last Update</TableHead>
                    <TableHead>Tracking</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeLocations.map((location) => {
                    const statusColor = getStatusColor(location.seconds_since_update, location.tracking_enabled)
                    return (
                      <TableRow key={location.driver_id}>
                        <TableCell className="font-medium">{location.driver_name}</TableCell>
                        <TableCell>{location.truck_number || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={location.driver_status === 'On Duty' ? 'default' : 'secondary'}>
                            {location.driver_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className={`h-4 w-4 text-${statusColor}-500`} />
                            <a
                              href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm"
                            >
                              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                            </a>
                          </div>
                        </TableCell>
                        <TableCell>{location.accuracy ? `±${Math.round(location.accuracy)}m` : '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{getTimeAgo(location.seconds_since_update)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={location.tracking_enabled}
                              onCheckedChange={() => handleToggleTracking(location.driver_id, location.tracking_enabled)}
                              disabled={updating}
                            />
                            <span className="text-xs text-muted-foreground">
                              {location.tracking_enabled ? 'On' : 'Off'}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
