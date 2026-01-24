"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Download } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useReportsData } from "@/hooks/use-supabase-data"

export default function ReportsPage() {
  const router = useRouter()
  const { user, loading: authLoading, isAdmin } = useAuth()
  const { monthlyData, loading } = useReportsData()
  
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
            <CardDescription>Export detailed analysis reports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Download size={16} className="mr-2" />
                Download Monthly Report
              </Button>
              <Button variant="outline" className="border-border text-foreground hover:bg-muted bg-transparent">
                <Download size={16} className="mr-2" />
                Download Fleet Summary
              </Button>
              <Button variant="outline" className="border-border text-foreground hover:bg-muted bg-transparent">
                <Download size={16} className="mr-2" />
                Download Driver Performance
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
