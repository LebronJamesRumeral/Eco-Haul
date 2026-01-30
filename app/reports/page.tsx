"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Download, Calendar } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useReportsData } from "@/hooks/use-supabase-data"
import { supabase } from "@/lib/supabase"

export default function ReportsPage() {
  const router = useRouter()
  const { user, loading: authLoading, isAdmin } = useAuth()
  const { monthlyData, loading } = useReportsData()
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [allDates, setAllDates] = useState(false)
  const [exporting, setExporting] = useState(false)
  
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
  
  const avgTrips = monthlyData.length > 0 
    ? Math.round(monthlyData.reduce((sum, m) => sum + m.trips, 0) / monthlyData.length)
    : 0
  const avgDistance = monthlyData.length > 0
    ? Math.round(monthlyData.reduce((sum, m) => sum + m.distance, 0) / monthlyData.length)
    : 0
  const avgCost = monthlyData.length > 0
    ? Math.round(monthlyData.reduce((sum, m) => sum + m.cost, 0) / monthlyData.length)
    : 0

  const exportToExcel = async (reportType: 'trips' | 'drivers' | 'trucks') => {
    if (!allDates && (!startDate || !endDate)) {
      alert("Please select both start and end dates, or check 'All Dates'")
      return
    }

    if (!allDates && new Date(startDate) > new Date(endDate)) {
      alert("Start date must be before end date")
      return
    }

    setExporting(true)
    try {
      let csvContent = ""
      let filename = ""

      if (reportType === 'trips') {
        // Fetch trips data for the date range or all data
        let query = supabase
          .from('trips')
          .select('*')
          .order('date', { ascending: false })
        
        if (!allDates) {
          query = query.gte('date', startDate).lte('date', endDate)
        }

        const { data: trips, error } = await query

        if (error) throw error

        // Create CSV for trips
        const headers = [
          "Date",
          "Truck Number",
          "Driver Name",
          "Receipt Number",
          "Start Time",
          "End Time",
          "Distance (km)",
          "Duration",
          "Cost (₱)"
        ]
        
        const rows = trips.map((trip) => [
          trip.date,
          trip.truck_number,
          trip.driver_name,
          trip.driver_receipt_number || "N/A",
          trip.start_time,
          trip.end_time,
          trip.distance,
          trip.duration,
          trip.cost.replace(/[₱,]/g, ''),
        ])

        csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")
        filename = allDates ? `trips-report-all-dates.csv` : `trips-report-${startDate}-to-${endDate}.csv`
      } else if (reportType === 'drivers') {
        // Fetch trips grouped by driver for the date range or all data
        let query = supabase
          .from('trips')
          .select('driver_name, driver_id, distance, cost, date')
        
        if (!allDates) {
          query = query.gte('date', startDate).lte('date', endDate)
        }

        const { data: trips, error } = await query

        if (error) throw error

        // Group by driver
        const driverMap = new Map()
        trips.forEach((trip) => {
          if (!driverMap.has(trip.driver_name)) {
            driverMap.set(trip.driver_name, {
              name: trip.driver_name,
              trips: 0,
              distance: 0,
              earnings: 0
            })
          }
          const driver = driverMap.get(trip.driver_name)
          driver.trips++
          driver.distance += Number(trip.distance)
          driver.earnings += Number(trip.cost.replace(/[₱,]/g, ''))
        })

        const headers = ["Driver Name", "Total Trips", "Total Distance (km)", "Total Earnings (₱)"]
        const rows = Array.from(driverMap.values()).map((driver) => [
          driver.name,
          driver.trips,
          driver.distance.toFixed(2),
          driver.earnings.toFixed(2),
        ])

        csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")
        filename = allDates ? `driver-performance-all-dates.csv` : `driver-performance-${startDate}-to-${endDate}.csv`
      } else if (reportType === 'trucks') {
        // Fetch trips grouped by truck for the date range or all data
        let query = supabase
          .from('trips')
          .select('truck_number, truck_id, distance, cost, date')
        
        if (!allDates) {
          query = query.gte('date', startDate).lte('date', endDate)
        }

        const { data: trips, error } = await query

        if (error) throw error

        // Group by truck
        const truckMap = new Map()
        trips.forEach((trip) => {
          if (!truckMap.has(trip.truck_number)) {
            truckMap.set(trip.truck_number, {
              number: trip.truck_number,
              trips: 0,
              distance: 0,
              cost: 0
            })
          }
          const truck = truckMap.get(trip.truck_number)
          truck.trips++
          truck.distance += Number(trip.distance)
          truck.cost += Number(trip.cost.replace(/[₱,]/g, ''))
        })

        const headers = ["Truck Number", "Total Trips", "Total Distance (km)", "Total Cost (₱)"]
        const rows = Array.from(truckMap.values()).map((truck) => [
          truck.number,
          truck.trips,
          truck.distance.toFixed(2),
          truck.cost.toFixed(2),
        ])

        csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")
        filename = allDates ? `fleet-summary-all-dates.csv` : `fleet-summary-${startDate}-to-${endDate}.csv`
      }

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", filename)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export report')
    } finally {
      setExporting(false)
    }
  }
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Reports</h1>
          <p className="text-muted-foreground">Historical data and performance analytics</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Monthly Trips</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-accent">{avgTrips}</div>
                  <p className="text-xs text-muted-foreground mt-1">Last 6 months</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Monthly Distance</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-accent">{avgDistance.toLocaleString()} km</div>
                  <p className="text-xs text-muted-foreground mt-1">Per month</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Monthly Cost</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-accent">₱{avgCost.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">Payroll cost</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Monthly Trips Trend</CardTitle>
              <CardDescription>Trip count over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
                    <XAxis stroke="#999999" dataKey="month" />
                    <YAxis stroke="#999999" />
                    <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333333" }} />
                    <Line
                      type="monotone"
                      dataKey="trips"
                      stroke="hsl(142, 8%, 45%)"
                      strokeWidth={2}
                      dot={{ fill: "hsl(142, 8%, 45%)" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Distance Report</CardTitle>
              <CardDescription>Monthly distance trends</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
                    <XAxis stroke="#999999" dataKey="month" />
                    <YAxis stroke="#999999" />
                    <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333333" }} />
                    <Bar dataKey="distance" fill="hsl(142, 8%, 45%)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Download Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Generate Custom Reports</CardTitle>
            <CardDescription>Export detailed analysis reports for a specific date range</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date Mode Selector */}
            <div className="space-y-4">
              {/* Segmented Button */}
              <div className="inline-flex rounded-lg bg-muted p-1 gap-1">
                <button
                  onClick={() => setAllDates(false)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    !allDates
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Date range
                </button>
                <button
                  onClick={() => setAllDates(true)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    allDates
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All dates
                </button>
              </div>

              {/* Date Inputs - Only show when Date range is selected */}
              {!allDates && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                      Range Start
                    </Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                      Range End
                    </Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Export Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => exportToExcel('trips')}
                disabled={(!allDates && (!startDate || !endDate)) || exporting}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Download size={16} className="mr-2" />
                {exporting ? 'Exporting...' : 'Download Trips Report'}
              </Button>
              <Button 
                onClick={() => exportToExcel('drivers')}
                disabled={(!allDates && (!startDate || !endDate)) || exporting}
                variant="outline" 
                className="border-border text-foreground hover:bg-muted bg-transparent"
              >
                <Download size={16} className="mr-2" />
                Download Driver Performance
              </Button>
              <Button 
                onClick={() => exportToExcel('trucks')}
                disabled={(!allDates && (!startDate || !endDate)) || exporting}
                variant="outline" 
                className="border-border text-foreground hover:bg-muted bg-transparent"
              >
                <Download size={16} className="mr-2" />
                Download Fleet Summary
              </Button>
            </div>

            {allDates ? (
              <p className="text-sm text-accent">
                Ready to export all historical data from the database
              </p>
            ) : !startDate || !endDate ? (
              <p className="text-sm text-muted-foreground">
                Please select a date range to enable report downloads
              </p>
            ) : (
              <p className="text-sm text-accent">
                Ready to export reports from {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
