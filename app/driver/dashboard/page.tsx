'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useNotifications } from '@/hooks/use-notifications'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { useTrips } from '@/hooks/use-supabase-data'
import { useDriverData, useDriverComplianceRecords, useDriverPayroll, createDriverTrip } from '@/hooks/use-supabase-data'
import { logout } from '@/lib/auth'
import { AlertCircle, CheckCircle2, Truck, MapPin, DollarSign, TrendingUp } from 'lucide-react'
import { GPSTracker } from '@/components/gps-tracker'

export default function DriverDashboard() {
  const router = useRouter()
  const { user, loading: authLoading, isDriver } = useAuth()
  const { trips, loading: tripsLoading, refetch } = useTrips()
  const { notifyTripStarted, notifyTripCompleted } = useNotifications()
  const [creatingTrip, setCreatingTrip] = useState(false)
  
  // Fetch driver-specific data
  const { driver, truck, loading: driverLoading } = useDriverData(user?.driver_id)
  const { records: complianceRecords, loading: complianceLoading } = useDriverComplianceRecords(user?.driver_id)
  const { payroll, loading: payrollLoading } = useDriverPayroll(user?.driver_id)
  const canStartTrip = !!(truck?.id && truck?.truck_number)
  const [activeTrip, setActiveTrip] = useState<any>(null)

  useEffect(() => {
    if (!authLoading && (!user || !isDriver)) {
      router.push('/login')
    }
  }, [authLoading, user, isDriver, router])

  // Check if there's an active trip (end_time is null)
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const todayTrips = trips.filter(trip => trip.driver_id === user?.driver_id && trip.date === today)
    console.log('Today trips:', todayTrips)
    const active = todayTrips.find(t => {
      const isActive = t.end_time === null
      console.log(`Trip ${t.id}: start=${t.start_time}, end=${t.end_time}, active=${isActive}`)
      return isActive
    })
    console.log('Active trip:', active || 'None')
    setActiveTrip(active || null)
  }, [trips, user?.driver_id])

  // Refresh trips data every minute to ensure daily stats update
  useEffect(() => {
    if (!authLoading && user && isDriver) {
      const interval = setInterval(() => {
        refetch()
      }, 60000) // Refresh every 60 seconds

      return () => clearInterval(interval)
    }
  }, [authLoading, user, isDriver, refetch])

  if (authLoading) {
    return (
      <DashboardLayout>
        <Skeleton className="h-screen w-full" />
      </DashboardLayout>
    )
  }

  if (!user || !isDriver) {
    return null
  }

  // Filter trips for current driver
  const driverTrips = trips.filter(trip => trip.driver_id === user.driver_id)
  
  // Calculate today's stats (always based on current date)
  const today = new Date().toISOString().split('T')[0]
  const todayTrips = driverTrips.filter(trip => trip.date === today)
  const totalDistance = todayTrips.reduce((sum, trip) => sum + Number(trip.distance), 0)
  const totalCost = todayTrips.reduce((sum, trip) => {
    const cost = trip.cost.replace(/[₱,]/g, '')
    return sum + Number(cost)
  }, 0)

  // Calculate this week's earnings (7 days including today)
  const today_date = new Date()
  const weekAgo = new Date(today_date.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const weekTrips = driverTrips.filter(trip => trip.date >= weekAgo)
  const weekEarnings = weekTrips.reduce((sum, trip) => {
    const cost = trip.cost.replace(/[₱,]/g, '')
    return sum + Number(cost)
  }, 0)

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const handleStartTrip = async () => {
    if (!user?.driver_id || !driver) {
      console.error('Missing driver or user data')
      return
    }
    if (!canStartTrip) {
      console.error('Cannot start trip: no truck assigned')
      return
    }
    console.log('Starting trip for driver:', user.driver_id)
    setCreatingTrip(true)
    try {
      const result = await createDriverTrip({
        driverId: user.driver_id,
        driverName: driver.name,
        truckId: truck.id,
        truckNumber: truck.truck_number,
      })
      console.log('Trip created:', result)
      // Send notification
      notifyTripStarted(driver.name, truck.truck_number)
      await refetch()
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err)
      console.error('Error creating trip:', msg)
      alert(`Error: ${msg}`)
    } finally {
      setCreatingTrip(false)
    }
  }

  const handleCompleteTrip = async () => {
    if (!activeTrip) {
      console.error('No active trip to complete')
      return
    }
    console.log('Completing trip:', activeTrip.id)
    setCreatingTrip(true)
    try {
      const result = await createDriverTrip({
        driverId: user.driver_id,
        driverName: driver.name,
        truckId: truck.id,
        truckNumber: truck.truck_number,
      })
      console.log('Trip completed:', result)
      // Immediately clear active trip to show "Start Trip" button
      setActiveTrip(null)
      // Then refetch to update data
      await refetch()
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err)
      console.error('Error completing trip:', msg)
      alert(`Error: ${msg}`)
    } finally {
      setCreatingTrip(false)
    }
  }

  // Get compliance status for driver's truck
  const latestCompliance = complianceRecords[0]
  const complianceStatus = latestCompliance?.status === 'Compliant' ? 'Compliant' : 'Needs Review'

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* GPS Tracker - only tracks when trip is active */}
        <GPSTracker activeTrip={activeTrip} />
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Driver Dashboard</h1>
            <p className="text-muted-foreground">Welcome, {driver?.name || user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            {activeTrip ? (
              <div className="flex flex-col gap-2">
                <div className="text-sm text-amber-400 font-semibold">Trip Active</div>
                <Button 
                  onClick={handleCompleteTrip} 
                  disabled={creatingTrip} 
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2"
                >
                  {creatingTrip ? 'Completing…' : '⏹ Trip Completed'}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="text-sm text-green-400 font-semibold">Ready</div>
                <Button 
                  onClick={handleStartTrip} 
                  disabled={creatingTrip || driverLoading || !canStartTrip} 
                  className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2"
                >
                  {creatingTrip ? 'Starting…' : !canStartTrip ? 'Assign truck first' : '▶ Start Trip'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Driver Profile Card */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>Driver information and assignment</CardDescription>
          </CardHeader>
          <CardContent>
            {driverLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-6 w-32" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Name</p>
                  <p className="text-lg font-semibold text-foreground">{driver?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${driver?.status === 'On Duty' ? 'bg-green-500' : 'bg-gray-500'}`} />
                    <p className="text-lg font-semibold text-foreground">{driver?.status}</p>
                  </div>
                </div>
                {truck && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Assigned Truck</p>
                      <p className="text-lg font-semibold text-foreground">{truck.truck_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Plate Number</p>
                      <p className="text-lg font-semibold text-foreground">{truck.plate_number}</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Trips Today</CardTitle>
                <TrendingUp className="w-4 h-4 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{todayTrips.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Completed</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Distance Today</CardTitle>
                <MapPin className="w-4 h-4 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{totalDistance.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground mt-1">km traveled</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Earnings Today</CardTitle>
                <DollarSign className="w-4 h-4 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">₱{totalCost.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Estimated</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Weekly Earnings</CardTitle>
                <TrendingUp className="w-4 h-4 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">₱{weekEarnings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Compliance & Vehicle Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Compliance Status */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Compliance Status</CardTitle>
              <CardDescription>Your vehicle's recent inspection</CardDescription>
            </CardHeader>
            <CardContent>
              {complianceLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : latestCompliance ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      {complianceStatus === 'Compliant' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                      )}
                      <div>
                        <p className="font-medium text-foreground">{complianceStatus}</p>
                        <p className="text-xs text-muted-foreground">{latestCompliance.site}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(latestCompliance.last_check).toLocaleDateString()}
                    </p>
                  </div>
                  {latestCompliance.notes && (
                    <p className="text-sm text-muted-foreground italic">{latestCompliance.notes}</p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No compliance records yet</p>
              )}
            </CardContent>
          </Card>

          {/* Vehicle Info */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Vehicle Information</CardTitle>
              <CardDescription>Your assigned truck details</CardDescription>
            </CardHeader>
            <CardContent>
              {driverLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-6 w-32" />
                </div>
              ) : truck ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">Truck Number</span>
                    <span className="font-semibold text-foreground">{truck.truck_number}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">Plate Number</span>
                    <span className="font-semibold text-foreground">{truck.plate_number}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">Capacity</span>
                    <span className="font-semibold text-foreground">{truck.capacity} tons</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span className={`font-semibold ${truck.status === 'Active' ? 'text-green-500' : 'text-gray-500'}`}>
                      {truck.status}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No truck assigned</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Today's Trips */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Today's Trips</CardTitle>
            <CardDescription>Your completed and scheduled trips for today</CardDescription>
          </CardHeader>
          <CardContent>
            {tripsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : todayTrips.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No trips scheduled for today</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Start Time</TableHead>
                      <TableHead>End Time</TableHead>
                      <TableHead>Distance (km)</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Earnings</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todayTrips.map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell>{trip.start_time}</TableCell>
                        <TableCell>{trip.end_time}</TableCell>
                        <TableCell>{trip.distance}</TableCell>
                        <TableCell>{trip.duration}</TableCell>
                        <TableCell className="font-medium">{trip.cost}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payroll Records */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Recent Payroll</CardTitle>
            <CardDescription>Your earnings history (last 12 months)</CardDescription>
          </CardHeader>
          <CardContent>
            {payrollLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : payroll.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No payroll records yet</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Trips</TableHead>
                      <TableHead>Distance (km)</TableHead>
                      <TableHead>Tonnage</TableHead>
                      <TableHead>Total Earnings</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payroll.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                        <TableCell>{record.trip_count}</TableCell>
                        <TableCell>{record.distance}</TableCell>
                        <TableCell>{record.tonnage} tons</TableCell>
                        <TableCell className="font-semibold text-green-600">₱{record.total_cost.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trip History */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Trip History</CardTitle>
            <CardDescription>Your recent trips (last 30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            {tripsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : driverTrips.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No trip history</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Start Time</TableHead>
                      <TableHead>End Time</TableHead>
                      <TableHead>Distance (km)</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Earnings</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {driverTrips.slice(0, 15).map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell>{trip.date}</TableCell>
                        <TableCell>{trip.start_time}</TableCell>
                        <TableCell>{trip.end_time}</TableCell>
                        <TableCell>{trip.distance}</TableCell>
                        <TableCell>{trip.duration}</TableCell>
                        <TableCell>{trip.cost}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
