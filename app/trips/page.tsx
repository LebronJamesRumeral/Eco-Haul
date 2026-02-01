"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { useTrips, createTrip } from "@/hooks/use-supabase-data"
import { useAuth } from "@/hooks/use-auth"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export default function TripsPage() {
  const router = useRouter()
  const { user, loading: authLoading, isDriver, isAdmin } = useAuth()
  const [search, setSearch] = useState("")
  const [debounced, setDebounced] = useState("")
  const today = new Date().toISOString().split('T')[0]
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [singleDate, setSingleDate] = useState(today)
  const [dateMode, setDateMode] = useState<'range' | 'single' | 'all'>('all')
  
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])
  
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300)
    return () => clearTimeout(t)
  }, [search])
  
  const { trips, loading } = useTrips({ search: debounced })

  // Normalize date range
  const normalizedRangeStart = startDate && endDate && startDate <= endDate ? startDate : endDate
  const normalizedRangeEnd = startDate && endDate && startDate <= endDate ? endDate : startDate

  // Filter trips based on user role and date
  let displayedTrips = isDriver && user?.driver_id
    ? trips.filter(trip => trip.driver_id === user.driver_id)
    : trips
  
  // Apply date filter based on mode
  displayedTrips = displayedTrips.filter((trip) => {
    if (dateMode === 'all') return true
    if (dateMode === 'single') return trip.date === singleDate
    return trip.date >= normalizedRangeStart && trip.date <= normalizedRangeEnd
  })

  // Group trips by date
  const tripsByDate = displayedTrips.reduce((acc, trip) => {
    const date = trip.date
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(trip)
    return acc
  }, {} as Record<string, typeof displayedTrips>)

  // Sort dates in descending order (newest first)
  const sortedDates = Object.keys(tripsByDate).sort((a, b) => b.localeCompare(a))

  // Create Trip form state
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [truckNumber, setTruckNumber] = useState("")
  const [driverName, setDriverName] = useState("")
  const [receiptNumber, setReceiptNumber] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [distance, setDistance] = useState<number>(0)
  const [duration, setDuration] = useState("")
  const [cost, setCost] = useState("")
  
  if (authLoading) {
    return (
      <DashboardLayout>
        <Skeleton className="h-screen w-full" />
      </DashboardLayout>
    )
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {isDriver ? "My Trips" : "Trip Monitoring"}
          </h1>
          <p className="text-muted-foreground">
            {isDriver ? "Track your completed and scheduled trips" : "Track and monitor all active and completed trips"}
          </p>
        </div>

        {/* Trip Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="space-y-4">
              {/* Title and Search */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1">
                  <CardTitle>Trip Logs</CardTitle>
                  <CardDescription className="mt-1.5">
                    {isDriver ? "Your trip history" : "Complete record of all trips with timestamps and costs"}
                  </CardDescription>
                </div>
                {!isDriver && (
                  <div className="w-full sm:w-auto sm:min-w-[280px]">
                    <Input
                      placeholder="Search driver or truck..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                )}
              </div>
              
              {/* Date Range Picker */}
              <div className="rounded-xl border border-border/60 bg-card/80 p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-1">
                  <button
                    type="button"
                    onClick={() => setDateMode('all')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${dateMode === 'all' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    All dates
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateMode('single')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${dateMode === 'single' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Single date
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateMode('range')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${dateMode === 'range' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Date range
                  </button>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Range start</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      disabled={dateMode !== 'range'}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary h-9 disabled:opacity-60"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Range end</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      disabled={dateMode !== 'range'}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary h-9 disabled:opacity-60"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Single date</label>
                    <input
                      type="date"
                      value={singleDate}
                      onChange={(e) => setSingleDate(e.target.value)}
                      disabled={dateMode !== 'single'}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary h-9 disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Create Trip - Only for Admin */}
            {isAdmin && (
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <h3 className="font-semibold mb-4 text-foreground text-base">Add Trip</h3>
                <div className="space-y-4">
                  {/* Row 1 */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</Label>
                      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Truck #</Label>
                      <Input value={truckNumber} onChange={(e) => setTruckNumber(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Driver</Label>
                      <Input value={driverName} onChange={(e) => setDriverName(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Receipt #</Label>
                      <Input placeholder="RCP-001-001" value={receiptNumber} onChange={(e) => setReceiptNumber(e.target.value)} className="mt-1" />
                    </div>
                  </div>
                  
                  {/* Row 2 */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div>
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Start Time</Label>
                      <Input placeholder="06:00 AM" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">End Time</Label>
                      <Input placeholder="08:15 AM" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Distance (km)</Label>
                      <Input type="number" value={distance} onChange={(e) => setDistance(Number(e.target.value))} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Duration</Label>
                      <Input placeholder="2h 15m" value={duration} onChange={(e) => setDuration(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cost</Label>
                      <Input placeholder="₱2,250" value={cost} onChange={(e) => setCost(e.target.value)} className="mt-1" />
                    </div>
                  </div>
                  
                  {/* Save Button */}
                  <div className="flex justify-end">
                    <Button
                      onClick={async () => {
                        // Validate all 4 required fields
                        if (!truckNumber || !driverName || !receiptNumber || !date) {
                          alert("Please fill in all required fields: Truck, Driver, Receipt Number, and Date")
                          return
                        }
                        await createTrip({ 
                          date, 
                          truck_id: null as any, 
                          truck_number: truckNumber, 
                          driver_id: null as any, 
                          driver_name: driverName,
                          driver_receipt_number: receiptNumber,
                          start_time: startTime, 
                          end_time: endTime, 
                          distance, 
                          duration, 
                          cost 
                        })
                        // Reset form
                        setTruckNumber("")
                        setDriverName("")
                        setReceiptNumber("")
                        setStartTime("")
                        setEndTime("")
                        setDistance(0)
                        setDuration("")
                        setCost("")
                      }}
                      className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-3 py-2 text-sm whitespace-nowrap"
                    >
                      Save Trip
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Trips grouped by date */}
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="border border-border rounded-lg p-4">
                    <Skeleton className="h-6 w-32 mb-4" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                ))}
              </div>
            ) : displayedTrips.length === 0 ? (
              <div className="text-center py-12 border border-border rounded-lg">
                <p className="text-lg font-medium text-foreground">{isDriver ? "No trips yet" : "No trips found"}</p>
                <p className="text-sm text-muted-foreground mt-1">Trips will appear here once they are created</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedDates.map((date) => {
                  const tripsForDate = tripsByDate[date]
                  const tripCount = tripsForDate.length
                  const totalDistance = tripsForDate.reduce((sum, trip) => sum + Number(trip.distance || 0), 0)
                  
                  return (
                    <div key={date} className="border border-border rounded-lg overflow-hidden bg-card">
                      {/* Date Header */}
                      <div className="bg-muted px-4 py-3 border-b border-border">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg text-foreground">{date}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{tripCount} {tripCount === 1 ? 'trip' : 'trips'}</span>
                            <span>•</span>
                            <span>{totalDistance.toFixed(1)} km total</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Trips Table */}
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow className="border-border">
                            {!isDriver && <TableHead className="text-foreground">Truck</TableHead>}
                            {!isDriver && <TableHead className="text-foreground">Driver</TableHead>}
                            <TableHead className="text-foreground">Receipt #</TableHead>
                            <TableHead className="text-foreground">Start Time</TableHead>
                            <TableHead className="text-foreground">End Time</TableHead>
                            <TableHead className="text-right text-foreground">Distance (km)</TableHead>
                            <TableHead className="text-right text-foreground">Duration</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tripsForDate.map((trip) => (
                            <TableRow key={trip.id} className="border-border hover:bg-muted/50">
                              {!isDriver && <TableCell className="text-foreground">{trip.truck_number}</TableCell>}
                              {!isDriver && <TableCell className="text-foreground">{trip.driver_name}</TableCell>}
                              <TableCell className="text-foreground">{trip.driver_receipt_number || 'N/A'}</TableCell>
                              <TableCell className="text-foreground">{trip.start_time}</TableCell>
                              <TableCell className="text-foreground">{trip.end_time}</TableCell>
                              <TableCell className="text-right text-foreground">{trip.distance}</TableCell>
                              <TableCell className="text-right text-foreground">{trip.duration}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}