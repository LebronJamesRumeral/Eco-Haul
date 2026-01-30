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

  // Filter trips based on user role
  const displayedTrips = isDriver && user?.driver_id
    ? trips.filter(trip => trip.driver_id === user.driver_id)
    : trips

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
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Trip Logs</CardTitle>
                <CardDescription>
                  {isDriver ? "Your trip history" : "Complete record of all trips with timestamps and costs"}
                </CardDescription>
              </div>
              {!isDriver && (
                <Input
                  placeholder="Search driver or truck..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="max-w-xs"
                />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Create Trip - Only for Admin */}
            {isAdmin && (
              <div className="mb-4 p-4 border border-border rounded-lg">
                <h3 className="font-semibold mb-3 text-foreground">Add Trip</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div>
                    <Label>Date</Label>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  </div>
                  <div>
                    <Label>Truck #</Label>
                    <Input value={truckNumber} onChange={(e) => setTruckNumber(e.target.value)} />
                  </div>
                  <div>
                    <Label>Driver</Label>
                    <Input value={driverName} onChange={(e) => setDriverName(e.target.value)} />
                  </div>
                  <div>
                    <Label>Receipt #</Label>
                    <Input placeholder="RCP-001-001" value={receiptNumber} onChange={(e) => setReceiptNumber(e.target.value)} />
                  </div>
                  <div>
                    <Label>Start Time</Label>
                    <Input placeholder="06:00 AM" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                  </div>
                <div>
                  <Label>End Time</Label>
                  <Input placeholder="08:15 AM" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
                <div>
                  <Label>Distance (km)</Label>
                  <Input type="number" value={distance} onChange={(e) => setDistance(Number(e.target.value))} />
                </div>
                <div>
                  <Label>Duration</Label>
                  <Input placeholder="2h 15m" value={duration} onChange={(e) => setDuration(e.target.value)} />
                </div>
                <div>
                  <Label>Cost</Label>
                  <Input placeholder="₱2,250" value={cost} onChange={(e) => setCost(e.target.value)} />
                </div>
                <div className="flex items-end">
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
                    className="bg-accent text-accent-foreground"
                  >
                    Save Trip
                  </Button>
                </div>
                </div>
              </div>
            )}
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow className="border-border">
                    <TableHead className="text-foreground">Date</TableHead>
                    {!isDriver && <TableHead className="text-foreground">Truck</TableHead>}
                    {!isDriver && <TableHead className="text-foreground">Driver</TableHead>}
                    <TableHead className="text-foreground">Receipt #</TableHead>
                    <TableHead className="text-foreground">Start Time</TableHead>
                    <TableHead className="text-foreground">End Time</TableHead>
                    <TableHead className="text-right text-foreground">Distance (km)</TableHead>
                    <TableHead className="text-right text-foreground">Duration</TableHead>
                    <TableHead className="text-right text-foreground">Earnings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <TableRow key={i} className="border-border">
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        {!isDriver && <TableCell><Skeleton className="h-4 w-16" /></TableCell>}
                        {!isDriver && <TableCell><Skeleton className="h-4 w-32" /></TableCell>}
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : displayedTrips.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isDriver ? 6 : 9} className="text-center text-muted-foreground py-8">
                        {isDriver ? "No trips yet" : "No trips found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayedTrips.map((trip) => (
                      <TableRow key={trip.id} className="border-border hover:bg-muted/50">
                        <TableCell className="font-medium text-foreground">{trip.date}</TableCell>
                        {!isDriver && <TableCell className="text-foreground">{trip.truck_number}</TableCell>}
                        {!isDriver && <TableCell className="text-foreground">{trip.driver_name}</TableCell>}
                        <TableCell className="text-foreground">{trip.driver_receipt_number || 'N/A'}</TableCell>
                        <TableCell className="text-foreground">{trip.start_time}</TableCell>
                        <TableCell className="text-foreground">{trip.end_time}</TableCell>
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