"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useDrivers, createDriver, assignDriverToTruck, updateDriver } from "@/hooks/use-supabase-data"
import { useAuth } from "@/hooks/use-auth"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Eye } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function DriversPage() {
  const router = useRouter()
  const { user, loading: authLoading, isAdmin } = useAuth()
  const [search, setSearch] = useState("")
  const [debounced, setDebounced] = useState("")
  
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/login')
    }
  }, [authLoading, user, isAdmin, router])
  
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300)
    return () => clearTimeout(t)
  }, [search])
  
  const { drivers, loading } = useDrivers(debounced)

  const [name, setName] = useState("")
  const [status, setStatus] = useState("On Duty")
  
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Driver Management</h1>
          <p className="text-muted-foreground">Monitor driver assignments and daily performance</p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Driver Roster</CardTitle>
                <CardDescription>All registered drivers in the system</CardDescription>
              </div>
              <Input
                placeholder="Search driver or truck..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-xs"
              />
            </div>
          </CardHeader>
          <CardContent>
            {/* Create Driver */}
            <div className="mb-4 p-4 border border-border rounded-lg">
              <h3 className="font-semibold mb-3 text-foreground">Add Driver</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="driverName">Name</Label>
                  <Input id="driverName" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="On Duty">On Duty</SelectItem>
                      <SelectItem value="Off Duty">Off Duty</SelectItem>
                      <SelectItem value="Leave">Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={async () => {
                      if (!name) return
                      const created = await createDriver({ name, status: status as any, trips_today: 0, distance_today: 0 })
                      setName("")
                      setStatus("On Duty")
                    }}
                    className="bg-accent text-accent-foreground"
                  >
                    Save Driver
                  </Button>
                </div>
              </div>
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow className="border-border">
                    <TableHead className="text-foreground">Name</TableHead>
                    <TableHead className="text-foreground">Assigned Truck</TableHead>
                    <TableHead className="text-foreground">Status</TableHead>
                    <TableHead className="text-right text-foreground">Trips Today</TableHead>
                    <TableHead className="text-right text-foreground">Distance Today (km)</TableHead>
                    <TableHead className="text-center text-foreground">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i} className="border-border">
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-16 mx-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : drivers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No drivers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    drivers.map((driver) => (
                      <TableRow key={driver.id} className="border-border hover:bg-muted/50">
                        <TableCell className="font-medium text-foreground">{driver.name}</TableCell>
                        <TableCell className="text-foreground">{driver.truck_number || 'Unassigned'}</TableCell>
                        <TableCell>
                          <Select
                            value={driver.status}
                            onValueChange={async (value) => {
                              await updateDriver(driver.id, { status: value as any })
                              window.location.reload()
                            }}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="On Duty">On Duty</SelectItem>
                              <SelectItem value="Off Duty">Off Duty</SelectItem>
                              <SelectItem value="Leave">Leave</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right text-foreground">{driver.trips_today}</TableCell>
                        <TableCell className="text-right text-foreground">{driver.distance_today}</TableCell>
                        <TableCell className="text-center">
                          <Link href={`/drivers/${driver.id}`}>
                            <Button variant="ghost" size="sm" className="text-accent hover:bg-muted">
                              <Eye size={16} className="mr-1" />
                              View
                            </Button>
                          </Link>
                        </TableCell>
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
