"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

const dailyTripLog = [
  { date: "2024-01-15", trips: 4, distance: 245.2, time: "8h 45m", cost: "₱12,260" },
  { date: "2024-01-14", trips: 3, distance: 198.5, time: "7h 20m", cost: "₱9,925" },
  { date: "2024-01-13", trips: 5, distance: 267.1, time: "9h 30m", cost: "₱13,355" },
  { date: "2024-01-12", trips: 3, distance: 156.8, time: "6h 15m", cost: "₱7,840" },
  { date: "2024-01-11", trips: 4, distance: 224.3, time: "8h 05m", cost: "₱11,215" },
]

export default function TruckProfilePage({ params }: { params: { id: string } }) {
  const truckNumber = "T-001"
  const truckDetails = {
    plate: "MTR-2024-001",
    color: "White",
    engine: "Cummins ISM 425",
    chassis: "Volvo FH16",
    capacity: 25,
    driver: "John Reyes",
    status: "Active",
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/trucks">
            <Button variant="ghost" size="sm" className="text-accent">
              <ArrowLeft size={16} className="mr-1" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Truck Profile: {truckNumber}</h1>
            <p className="text-muted-foreground">Detailed information and activity logs</p>
          </div>
        </div>

        {/* Truck Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Truck Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Truck Number</p>
                  <p className="text-foreground font-semibold">{truckNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Plate Number</p>
                  <p className="text-foreground font-semibold">{truckDetails.plate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Color</p>
                  <p className="text-foreground font-semibold">{truckDetails.color}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Capacity</p>
                  <p className="text-foreground font-semibold">{truckDetails.capacity} tons</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Engine</p>
                  <p className="text-foreground font-semibold">{truckDetails.engine}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Chassis</p>
                  <p className="text-foreground font-semibold">{truckDetails.chassis}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Current Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Assigned Driver</p>
                <p className="text-foreground font-semibold">{truckDetails.driver}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className="bg-accent text-accent-foreground mt-1">{truckDetails.status}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">GPS Activity Summary</p>
                <div className="mt-2 p-4 bg-muted rounded-md text-foreground">
                  <p className="text-sm">GPS tracking data placeholder - Live map integration available</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Trip Log */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Daily Trip Log</CardTitle>
            <CardDescription>Historical activity and performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow className="border-border">
                    <TableHead className="text-foreground">Date</TableHead>
                    <TableHead className="text-right text-foreground">Trips</TableHead>
                    <TableHead className="text-right text-foreground">Total Distance (km)</TableHead>
                    <TableHead className="text-right text-foreground">Total Time</TableHead>
                    <TableHead className="text-right text-foreground">Total Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyTripLog.map((log, index) => (
                    <TableRow key={index} className="border-border hover:bg-muted/50">
                      <TableCell className="font-medium text-foreground">{log.date}</TableCell>
                      <TableCell className="text-right text-foreground">{log.trips}</TableCell>
                      <TableCell className="text-right text-foreground">{log.distance}</TableCell>
                      <TableCell className="text-right text-foreground">{log.time}</TableCell>
                      <TableCell className="text-right text-accent font-semibold">{log.cost}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
