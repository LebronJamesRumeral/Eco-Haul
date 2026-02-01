"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useTrucks, updateTruck, createTruck } from "@/hooks/use-supabase-data"
import { useAuth } from "@/hooks/use-auth"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Eye } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function TrucksPage() {
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
  
  const { trucks, loading } = useTrucks(debounced)

  // Create truck form state
  const [truckNumber, setTruckNumber] = useState("")
  const [plateNumber, setPlateNumber] = useState("")
  const [capacity, setCapacity] = useState<number>(25)
  
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Truck Management</h1>
          <p className="text-muted-foreground">Monitor and manage your fleet of dump trucks</p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Active Fleet</CardTitle>
                <CardDescription>All registered dump trucks in the system</CardDescription>
              </div>
              <Input
                placeholder="Search truck #, plate #, driver..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-xs"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Create Truck */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <h3 className="font-semibold mb-4 text-foreground text-base">Add Truck</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div>
                  <Label htmlFor="truckNumber" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Truck #</Label>
                  <Input id="truckNumber" value={truckNumber} onChange={(e) => setTruckNumber(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="plateNumber" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Plate #</Label>
                  <Input id="plateNumber" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="capacity" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Capacity (tons)</Label>
                  <Input id="capacity" type="number" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className="mt-1" />
                </div>
                <Button
                  onClick={async () => {
                    if (!truckNumber || !plateNumber || !capacity) return
                    const created = await createTruck({ truck_number: truckNumber, plate_number: plateNumber, capacity, status: "Active" })
                    setTruckNumber("")
                    setPlateNumber("")
                    setCapacity(25)
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-3 py-2 text-sm whitespace-nowrap"
                >
                  Save Truck
                </Button>
              </div>
            </div>
            
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow className="border-border">
                    <TableHead className="text-foreground">Truck #</TableHead>
                    <TableHead className="text-foreground">Plate #</TableHead>
                    <TableHead className="text-foreground">Capacity (tons)</TableHead>
                    <TableHead className="text-foreground">Assigned Driver</TableHead>
                    <TableHead className="text-foreground">Status</TableHead>
                    <TableHead className="text-center text-foreground">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i} className="border-border">
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-16 mx-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : trucks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No trucks found
                      </TableCell>
                    </TableRow>
                  ) : (
                    trucks.map((truck) => (
                      <TableRow key={truck.id} className="border-border hover:bg-muted/50">
                        <TableCell className="font-medium text-foreground">{truck.truck_number}</TableCell>
                        <TableCell className="text-foreground">{truck.plate_number}</TableCell>
                        <TableCell className="text-foreground">{truck.capacity}</TableCell>
                        <TableCell className="text-foreground">{truck.driver_name || 'Unassigned'}</TableCell>
                        <TableCell>
                          <Select
                            value={truck.status}
                            onValueChange={async (value) => {
                              await updateTruck(truck.id, { status: value as any })
                              window.location.reload()
                            }}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Active">Active</SelectItem>
                              <SelectItem value="Inactive">Inactive</SelectItem>
                              <SelectItem value="Maintenance">Maintenance</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-center">
                          <Link href={`/trucks/${truck.id}`}>
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
