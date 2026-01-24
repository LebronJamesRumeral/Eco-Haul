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
import { MapPin, Navigation, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })

export default function GPSTrackingPage() {
  const router = useRouter()
  const { user, loading: authLoading, isAdmin } = useAuth()
  const { locations, loading, error } = useDriverLocations()
  const { toggleTracking, updating } = useToggleTracking()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    // Fix Leaflet default icon paths on the client
    if (typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        const defaultIcon = L.default.icon({
          iconUrl: '/leaflet/marker-icon.png',
          iconRetinaUrl: '/leaflet/marker-icon-2x.png',
          shadowUrl: '/leaflet/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        })
        L.default.Marker.prototype.options.icon = defaultIcon
      })
    }
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
  const mapCenter = activeLocations.length
    ? [activeLocations[0].latitude, activeLocations[0].longitude] as [number, number]
    : [14.5995, 120.9842] // Manila fallback

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
                {locations.filter(loc => loc.seconds_since_update < 120 && loc.tracking_enabled).length}
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

        {/* Live Map */}
        <Card>
          <CardHeader>
            <CardTitle>Live Map View</CardTitle>
            <CardDescription>Drivers with tracking enabled appear as map pins</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg overflow-hidden border border-border/40">
              {isClient && (
                <MapContainer center={mapCenter} zoom={12} style={{ height: '400px', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                  {activeLocations.map((loc) => (
                    <Marker key={loc.id} position={[loc.latitude, loc.longitude]}>
                      <Popup>
                        <div className="space-y-1">
                          <p className="font-semibold text-sm">{loc.driver_name}</p>
                          <p className="text-xs text-muted-foreground">Truck: {loc.truck_number || '—'}</p>
                          <p className="text-xs text-muted-foreground">Updated: {getTimeAgo(loc.seconds_since_update)}</p>
                          <a
                            href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Open in Google Maps
                          </a>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              )}
            </div>
            {activeLocations.length === 0 && (
              <p className="text-sm text-muted-foreground mt-3">No drivers with tracking enabled yet.</p>
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
                      <TableRow key={location.id}>
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
