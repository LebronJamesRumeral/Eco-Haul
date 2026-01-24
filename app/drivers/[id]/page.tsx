"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

const tripHistory = [
  { date: "2024-01-15", truck: "T-001", distance: 45.2, time: "2h 15m", cost: "₱2,250" },
  { date: "2024-01-15", truck: "T-001", distance: 52.1, time: "2h 30m", cost: "₱2,605" },
  { date: "2024-01-15", truck: "T-001", distance: 38.9, time: "1h 50m", cost: "₱1,945" },
  { date: "2024-01-15", truck: "T-001", distance: 41.5, time: "2h 05m", cost: "₱2,075" },
  { date: "2024-01-14", truck: "T-001", distance: 65.3, time: "3h 15m", cost: "₱3,265" },
]

export default function DriverProfilePage({ params }: { params: { id: string } }) {
  const driverName = "John Reyes"
  const driverDetails = {
    status: "On Duty",
    truck: "T-001",
    totalTripsToday: 4,
    totalDistanceToday: 245.2,
    totalEarningsToday: "₱8,875",
    weeklyEarnings: "₱52,340",
    hoursWorkedToday: "8h 40m",
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/drivers">
            <Button variant="ghost" size="sm" className="text-accent">
              <ArrowLeft size={16} className="mr-1" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Driver Profile: {driverName}</h1>
            <p className="text-muted-foreground">Trip history and performance metrics</p>
          </div>
        </div>

        {/* Driver Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className="bg-accent text-accent-foreground">{driverDetails.status}</Badge>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Assigned Truck</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{driverDetails.truck}</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Trips Today</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-accent">{driverDetails.totalTripsToday}</p>
              <p className="text-xs text-muted-foreground mt-1">Completed trips</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Earnings Today</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-accent">{driverDetails.totalEarningsToday}</p>
              <p className="text-xs text-muted-foreground mt-1">Daily earnings</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Work Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Hours Worked Today</p>
                <p className="text-foreground font-semibold">{driverDetails.hoursWorkedToday}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Distance Today</p>
                <p className="text-foreground font-semibold">{driverDetails.totalDistanceToday} km</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Weekly Earnings</p>
                <p className="text-accent font-semibold">{driverDetails.weeklyEarnings}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Driver Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="text-foreground font-semibold">{driverName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">License Status</p>
                <Badge className="bg-accent text-accent-foreground mt-1">Valid</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Experience</p>
                <p className="text-foreground font-semibold">5+ years</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trip History */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Trip History</CardTitle>
            <CardDescription>Recent trips and earnings breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow className="border-border">
                    <TableHead className="text-foreground">Date</TableHead>
                    <TableHead className="text-foreground">Truck</TableHead>
                    <TableHead className="text-right text-foreground">Distance (km)</TableHead>
                    <TableHead className="text-right text-foreground">Time</TableHead>
                    <TableHead className="text-right text-foreground">Earnings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tripHistory.map((trip, index) => (
                    <TableRow key={index} className="border-border hover:bg-muted/50">
                      <TableCell className="font-medium text-foreground">{trip.date}</TableCell>
                      <TableCell className="text-foreground">{trip.truck}</TableCell>
                      <TableCell className="text-right text-foreground">{trip.distance}</TableCell>
                      <TableCell className="text-right text-foreground">{trip.time}</TableCell>
                      <TableCell className="text-right text-accent font-semibold">{trip.cost}</TableCell>
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
