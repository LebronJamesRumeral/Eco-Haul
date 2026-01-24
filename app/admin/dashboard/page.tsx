'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useDashboardStats, useTrips, useChartData, useDrivers, useTrucks } from '@/hooks/use-supabase-data'
import { useAuth } from '@/hooks/use-auth'
import { Skeleton } from '@/components/ui/skeleton'
import { logout } from '@/lib/auth'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function AdminDashboard() {
  const router = useRouter()
  const { user, loading: authLoading, isAdmin } = useAuth()
  const { stats, loading: statsLoading } = useDashboardStats()
  const { trips, loading: tripsLoading } = useTrips()
  const { tripsPerDay, distancePerTruck, loading: chartLoading } = useChartData()
  const { drivers } = useDrivers()
  const { trucks } = useTrucks()
  const today = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(today)
  const [selectedDriver, setSelectedDriver] = useState<string>('all')
  const [selectedTruck, setSelectedTruck] = useState<string>('all')
  const [detailTruck, setDetailTruck] = useState<string>('')
  
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/login')
    }
  }, [authLoading, user, isAdmin, router])

  if (authLoading) {
    return (
      <DashboardLayout>
        <Skeleton className="h-screen w-full" />
      </DashboardLayout>
    )
  }

  if (!user || !isAdmin) {
    return null
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }
  
  const filteredTrips = trips.filter((trip) => {
    const matchesDate = trip.date === selectedDate
    const matchesDriver = selectedDriver === 'all' || trip.driver_name === selectedDriver
    const matchesTruck = selectedTruck === 'all' || trip.truck_number === selectedTruck
    return matchesDate && matchesDriver && matchesTruck
  })
  const recentTrips = filteredTrips.slice(0, 5)
  const selectedDistance = filteredTrips.reduce((sum, trip) => sum + Number(trip.distance || 0), 0)
  const selectedCost = filteredTrips.reduce((sum, trip) => {
    const parsed = typeof trip.cost === 'string' ? trip.cost.replace(/[₱,]/g, '') : trip.cost
    return sum + Number(parsed || 0)
  }, 0)
  const activeTrips = filteredTrips.filter((trip) => trip.start_time === trip.end_time).length
  const uniqueTrucks = new Set(filteredTrips.map((t) => t.truck_number)).size
  const uniqueDrivers = new Set(filteredTrips.map((t) => t.driver_name)).size

  const topTrucks = [...filteredTrips]
    .reduce<Record<string, { distance: number; trips: number; driver: string }>>((acc, trip) => {
      const key = trip.truck_number || 'Unassigned'
      if (!acc[key]) acc[key] = { distance: 0, trips: 0, driver: trip.driver_name || 'N/A' }
      acc[key].distance += Number(trip.distance || 0)
      acc[key].trips += 1
      return acc
    }, {})
  const topTrucksList = Object.entries(topTrucks)
    .map(([truck, data]) => ({ truck, ...data }))
    .sort((a, b) => b.distance - a.distance)
    .slice(0, 5)

  const topDrivers = [...filteredTrips]
    .reduce<Record<string, { distance: number; trips: number; truck: string }>>((acc, trip) => {
      const key = trip.driver_name || 'Unassigned'
      if (!acc[key]) acc[key] = { distance: 0, trips: 0, truck: trip.truck_number || 'N/A' }
      acc[key].distance += Number(trip.distance || 0)
      acc[key].trips += 1
      return acc
    }, {})
  const topDriversList = Object.entries(topDrivers)
    .map(([driver, data]) => ({ driver, ...data }))
    .sort((a, b) => b.trips - a.trips)
    .slice(0, 5)

  const maxTruckDistance = topTrucksList.length ? Math.max(...topTrucksList.map((t) => t.distance)) : 0
  const maxDriverTrips = topDriversList.length ? Math.max(...topDriversList.map((d) => d.trips)) : 0
  const driverOptions = Array.from(new Set(drivers.map((d) => d.name).filter(Boolean))).sort()
  const truckOptions = Array.from(new Set(trucks.map((t) => t.truck_number).filter(Boolean))).sort()
  
  const detailTruckData = trucks.find(t => t.truck_number === detailTruck)
  const detailTruckTrips = trips.filter(t => t.truck_number === detailTruck)
  const detailTruckDistance = detailTruckTrips.reduce((sum, trip) => sum + Number(trip.distance || 0), 0)
  const detailTruckCost = detailTruckTrips.reduce((sum, trip) => {
    const parsed = typeof trip.cost === 'string' ? trip.cost.replace(/[₱,]/g, '') : trip.cost
    return sum + Number(parsed || 0)
  }, 0)
  const detailTruckTripsCount = detailTruckTrips.length
  const detailTruckDrivers = new Set(detailTruckTrips.map(t => t.driver_name)).size
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-primary font-semibold">Operations overview</p>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Monitor trucks, drivers, and trips with a date-aware snapshot.</p>
          </div>
          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary h-9"
              />
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 rounded-lg border border-border/60 bg-card/70 px-4 py-4 shadow-sm">
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Driver</label>
            <Select value={selectedDriver} onValueChange={setSelectedDriver}>
              <SelectTrigger>
                <SelectValue placeholder="All drivers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All drivers</SelectItem>
                {driverOptions.map((driver) => (
                  <SelectItem key={driver} value={driver}>
                    {driver}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2 flex-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Truck</label>
            <Select value={selectedTruck} onValueChange={setSelectedTruck}>
              <SelectTrigger>
                <SelectValue placeholder="All trucks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All trucks</SelectItem>
                {truckOptions.map((truck) => (
                  <SelectItem key={truck} value={truck}>
                    {truck}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" size="sm" onClick={() => { setSelectedDriver('all'); setSelectedTruck('all') }} className="sm:self-end">
            Clear filters
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
          <Card className="bg-card border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Trucks</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold text-primary">{stats?.active_trucks || 0}</div>}
              <p className="text-xs text-muted-foreground mt-1">Live status</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Drivers On Duty</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold text-primary">{stats?.drivers_on_duty || 0}</div>}
              <p className="text-xs text-muted-foreground mt-1">Currently assigned</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Trips (date)</CardTitle>
            </CardHeader>
            <CardContent>
              {tripsLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold text-accent">{filteredTrips.length}</div>}
              <p className="text-xs text-muted-foreground mt-1">{selectedDate}</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Distance (km)</CardTitle>
            </CardHeader>
            <CardContent>
              {tripsLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold text-accent">{selectedDistance.toFixed(1)}</div>}
              <p className="text-xs text-muted-foreground mt-1">Total for date</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cost (₱)</CardTitle>
            </CardHeader>
            <CardContent>
              {tripsLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold text-accent">₱{selectedCost.toLocaleString()}</div>}
              <p className="text-xs text-muted-foreground mt-1">Payroll estimate</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Trips</CardTitle>
            </CardHeader>
            <CardContent>
              {tripsLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold text-accent">{activeTrips}</div>}
              <p className="text-xs text-muted-foreground mt-1">Start=End (in progress)</p>
            </CardContent>
          </Card>
        </div>

        {/* Date Snapshot Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-border/60">
            <CardHeader>
              <CardTitle>Unique Trucks ({uniqueTrucks})</CardTitle>
              <CardDescription>Trucks that have trips on {selectedDate}</CardDescription>
            </CardHeader>
            <CardContent>
              {tripsLoading ? <Skeleton className="h-24 w-full" /> : (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center text-sm font-semibold">{uniqueTrucks}</div>
                  <p>Distinct trucks logged trips on this date.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border/60">
            <CardHeader>
              <CardTitle>Unique Drivers ({uniqueDrivers})</CardTitle>
              <CardDescription>Drivers that have trips on {selectedDate}</CardDescription>
            </CardHeader>
            <CardContent>
              {tripsLoading ? <Skeleton className="h-24 w-full" /> : (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="h-10 w-10 rounded-lg bg-accent/10 text-accent grid place-items-center text-sm font-semibold">{uniqueDrivers}</div>
                  <p>Distinct drivers logged trips on this date.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border/60">
            <CardHeader>
              <CardTitle>Snapshot</CardTitle>
              <CardDescription>Quick view of trucks, drivers, and trips for the selected date.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-3 text-sm">
              {tripsLoading ? <Skeleton className="h-20 w-full col-span-3" /> : (
                <>
                  <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Trucks</p>
                    <p className="text-lg font-semibold text-foreground">{uniqueTrucks}</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Drivers</p>
                    <p className="text-lg font-semibold text-foreground">{uniqueDrivers}</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Trips</p>
                    <p className="text-lg font-semibold text-foreground">{filteredTrips.length}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Rankings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-card border-border/60">
            <CardHeader>
              <CardTitle>Top Trucks</CardTitle>
              <CardDescription>Ranked by distance on {selectedDate}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {tripsLoading ? (
                Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
              ) : topTrucksList.length === 0 ? (
                <p className="text-sm text-muted-foreground">No trips logged for this date.</p>
              ) : (
                topTrucksList.map((item) => (
                  <div key={item.truck} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="font-medium text-foreground">Truck {item.truck}</div>
                      <div className="text-muted-foreground">{item.distance.toFixed(1)} km</div>
                    </div>
                    <div className="text-xs text-muted-foreground">Driver: {item.driver}</div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${maxTruckDistance ? (item.distance / maxTruckDistance) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border/60">
            <CardHeader>
              <CardTitle>Top Drivers</CardTitle>
              <CardDescription>Ranked by trips on {selectedDate}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {tripsLoading ? (
                Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
              ) : topDriversList.length === 0 ? (
                <p className="text-sm text-muted-foreground">No trips logged for this date.</p>
              ) : (
                topDriversList.map((item) => (
                  <div key={item.driver} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="font-medium text-foreground">{item.driver}</div>
                      <div className="text-muted-foreground">{item.trips} trips</div>
                    </div>
                    <div className="text-xs text-muted-foreground">Truck: {item.truck}</div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${maxDriverTrips ? (item.trips / maxDriverTrips) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Truck Details Section */}
        <Card className="bg-card border-border/60">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Truck Details</CardTitle>
                <CardDescription>View detailed information about a specific truck</CardDescription>
              </div>
              <Select value={detailTruck} onValueChange={setDetailTruck}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select a truck..." />
                </SelectTrigger>
                <SelectContent>
                  {truckOptions.map((truck) => (
                    <SelectItem key={truck} value={truck}>
                      Truck {truck}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {!detailTruck ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Select a truck from the dropdown to view details</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Truck Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-lg border border-border/60 bg-muted/40 p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Truck Number</p>
                    <p className="text-xl font-semibold text-foreground">{detailTruckData?.truck_number}</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/40 p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Status</p>
                    <p className="text-lg font-semibold text-primary capitalize">{detailTruckData?.status || 'Unknown'}</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/40 p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Assigned Driver</p>
                    <p className="text-lg font-semibold text-foreground">{detailTruckData?.driver_name || 'Unassigned'}</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/40 p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Plate Number</p>
                    <p className="text-lg font-semibold text-foreground">{detailTruckData?.plate_number || 'N/A'}</p>
                  </div>
                </div>

                {/* Trip Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-background border-border/60">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Trips</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-primary">{detailTruckTripsCount}</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-background border-border/60">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Distance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-accent">{detailTruckDistance.toFixed(1)} km</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-background border-border/60">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Cost</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-accent">₱{detailTruckCost.toLocaleString()}</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-background border-border/60">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Drivers Used</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-primary">{detailTruckDrivers}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Trip History */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3">Trip History</h4>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted">
                        <TableRow className="border-border">
                          <TableHead className="text-foreground">Date</TableHead>
                          <TableHead className="text-foreground">Driver</TableHead>
                          <TableHead className="text-right text-foreground">Distance (km)</TableHead>
                          <TableHead className="text-right text-foreground">Duration</TableHead>
                          <TableHead className="text-right text-foreground">Cost</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailTruckTrips.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                              No trips found for this truck
                            </TableCell>
                          </TableRow>
                        ) : (
                          detailTruckTrips.slice(0, 10).map((trip) => (
                            <TableRow key={trip.id} className="border-border hover:bg-muted/50">
                              <TableCell className="text-foreground">{new Date(trip.date).toLocaleDateString()}</TableCell>
                              <TableCell className="text-foreground">{trip.driver_name}</TableCell>
                              <TableCell className="text-right text-foreground">{trip.distance}</TableCell>
                              <TableCell className="text-right text-foreground">{trip.duration}</TableCell>
                              <TableCell className="text-right text-accent font-semibold">{trip.cost}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {detailTruckTrips.length > 10 && (
                    <p className="text-xs text-muted-foreground mt-2">Showing 10 of {detailTruckTrips.length} trips</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trips per Day Chart */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Trips per Day</CardTitle>
              <CardDescription>Weekly trip distribution</CardDescription>
            </CardHeader>
            <CardContent>
              {chartLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={tripsPerDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
                    <XAxis stroke="#999999" dataKey="day" />
                    <YAxis stroke="#999999" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333333' }} />
                    <Line
                      type="monotone"
                      dataKey="trips"
                      stroke="hsl(142, 8%, 45%)"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(142, 8%, 45%)' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Distance per Truck Chart */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Distance per Truck</CardTitle>
              <CardDescription>Daily distance traveled (km)</CardDescription>
            </CardHeader>
            <CardContent>
              {chartLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={distancePerTruck}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
                    <XAxis stroke="#999999" dataKey="truck" />
                    <YAxis stroke="#999999" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333333' }} />
                    <Bar dataKey="distance" fill="hsl(142, 8%, 45%)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Trips Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Recent Trips</CardTitle>
            <CardDescription>Latest trip records from today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow className="border-border">
                    <TableHead className="text-foreground">Truck</TableHead>
                    <TableHead className="text-foreground">Driver</TableHead>
                    <TableHead className="text-right text-foreground">Distance (km)</TableHead>
                    <TableHead className="text-right text-foreground">Time</TableHead>
                    <TableHead className="text-right text-foreground">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tripsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i} className="border-border">
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : recentTrips.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No trips recorded yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentTrips.map((trip) => (
                      <TableRow key={trip.id} className="border-border hover:bg-muted/50">
                        <TableCell className="font-medium text-foreground">{trip.truck_number}</TableCell>
                        <TableCell className="text-foreground">{trip.driver_name}</TableCell>
                        <TableCell className="text-right text-foreground">{trip.distance}</TableCell>
                        <TableCell className="text-right text-foreground">{trip.duration}</TableCell>
                        <TableCell className="text-right text-accent font-semibold">{trip.cost}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
