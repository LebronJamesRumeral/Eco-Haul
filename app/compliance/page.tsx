"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useComplianceChecks, createComplianceCheck, updateComplianceCheck, useTrips, usePayrollRecords } from "@/hooks/use-supabase-data"
import { useAuth } from "@/hooks/use-auth"
import { useMinimumLoading } from "@/hooks/use-minimum-loading"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, CheckCircle2 } from "lucide-react"

export default function CompliancePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<string | undefined>(undefined)
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
  
  const { checks, loading } = useComplianceChecks(debounced, status as any)
  const { trips, loading: tripsLoading } = useTrips()
  const { records: payrollRecords, loading: payrollLoading } = usePayrollRecords()
  const showLoading = useMinimumLoading(loading || tripsLoading || payrollLoading, 800)
  
  const [site, setSite] = useState("")
  const [truck, setTruck] = useState("")
  const [newStatus, setNewStatus] = useState("Compliant")
  const [notes, setNotes] = useState("")
  
  // Filter trips with ALL 4 required fields (validated trips only)
  // Also exclude active trips (where end_time is null)
  const validatedTrips = trips.filter(trip => 
    trip.truck_number && 
    trip.date && 
    trip.driver_name && 
    trip.driver_receipt_number &&
    trip.end_time !== null && // Exclude active trips
    trip.end_time // Exclude empty end_time
  )
  
  const totalChecks = checks.length
  const compliantCount = checks.filter(c => c.status === 'Compliant').length
  const needsReviewCount = checks.filter(c => c.status === 'Needs Review').length
  
  // Calculate stats from validated trips and payroll records
  const totalVerifiedTrips = validatedTrips.length
  const totalPayrollCost = payrollRecords.reduce((sum, record) => sum + (record.payroll_cost || 0), 0)
  const totalBillingCost = payrollRecords.reduce((sum, record) => sum + (record.total_cost || 0), 0)
  const payrollByDriver = new Map()
  
  payrollRecords.forEach(record => {
    if (!payrollByDriver.has(record.driver_name)) {
      payrollByDriver.set(record.driver_name, { trips: 0, payroll: 0, billing: 0 })
    }
    const data = payrollByDriver.get(record.driver_name)
    data.trips += record.trip_count
    data.payroll += record.payroll_cost || 0
    data.billing += record.total_cost || 0
  })
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Cleanup Compliance (Admin)</h1>
          <p className="text-muted-foreground">Review and update driver-submitted cleanup compliance reports</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Checks</CardTitle>
            </CardHeader>
            <CardContent>
              {showLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-foreground">{totalChecks}</div>
                  <p className="text-xs text-muted-foreground mt-1">Recent inspections</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Compliant</CardTitle>
            </CardHeader>
            <CardContent>
              {showLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-accent">{compliantCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">Passed checks</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Needs Review</CardTitle>
            </CardHeader>
            <CardContent>
              {showLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-destructive">{needsReviewCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">Action required</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Verified Trips</CardTitle>
            </CardHeader>
            <CardContent>
              {tripsLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-primary">{totalVerifiedTrips}</div>
                  <p className="text-xs text-muted-foreground mt-1">With all required fields</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Trip Verification & Payroll Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20 text-green-600 font-bold">
                ✓
              </div>
              <div>
                <CardTitle>Trip Verification & Payroll</CardTitle>
                <CardDescription>Validated trips (with receipt numbers) and processed payroll records</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tripsLoading || payrollLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : validatedTrips && validatedTrips.length > 0 && payrollRecords && payrollRecords.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="p-4 rounded-lg bg-background/50 border border-border">
                      <div className="text-sm text-muted-foreground mb-1">Total Verified Trips</div>
                      <div className="text-2xl font-bold text-foreground">{totalVerifiedTrips}</div>
                      <p className="text-xs text-muted-foreground mt-2">With all required fields: plate, date, driver, receipt #</p>
                    </div>
                    <div className="p-4 rounded-lg bg-background/50 border border-border">
                      <div className="text-sm text-muted-foreground mb-1">Payroll Records</div>
                      <div className="text-2xl font-bold text-foreground">{payrollRecords.length}</div>
                      <p className="text-xs text-muted-foreground mt-2">Processed payroll entries</p>
                    </div>
                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                      <div className="text-sm text-muted-foreground mb-1">Total Billing Cost</div>
                      <div className="text-2xl font-bold text-blue-600">₱{totalBillingCost.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground mt-2">Client billing amount</p>
                    </div>
                    <div className="p-4 rounded-lg bg-green-500/10 border-2 border-green-500/30">
                      <div className="text-sm text-muted-foreground mb-1">Total Payroll Cost</div>
                      <div className="text-2xl font-bold text-green-600">₱{totalPayrollCost.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground mt-2">Driver payment amount</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-border bg-background/50">
                        <tr className="text-muted-foreground">
                          <th className="text-left py-3 px-2">Driver</th>
                          <th className="text-left py-3 px-2">Date</th>
                          <th className="text-center py-3 px-2">Trips</th>
                          <th className="text-right py-3 px-2">Billing Cost (₱)</th>
                          <th className="text-right py-3 px-2">Payroll Cost (₱)</th>
                          <th className="text-left py-3 px-2">Tier</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payrollRecords.slice(0, 20).map((record) => {
                          const tripCount = record.trip_count
                          const tier = tripCount <= 2 ? '1-2 trips (×400)' : tripCount === 3 ? '3 trips (×500)' : '4+ trips (×625)'
                          return (
                            <tr key={record.id} className="border-b border-border hover:bg-background/50">
                              <td className="py-3 px-2 font-medium text-foreground">{record.driver_name}</td>
                              <td className="py-3 px-2 text-foreground text-xs">{new Date(record.date).toLocaleDateString()}</td>
                              <td className="py-3 px-2 text-center text-foreground font-semibold">{tripCount}</td>
                              <td className="py-3 px-2 text-right text-blue-600 font-semibold">₱{record.total_cost.toLocaleString()}</td>
                              <td className="py-3 px-2 text-right text-green-600 font-semibold">₱{(record.payroll_cost || 0).toLocaleString()}</td>
                              <td className="py-3 px-2 text-xs text-muted-foreground">{tier}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  {payrollRecords.length > 20 && (
                    <div className="text-center text-xs text-muted-foreground mt-2">
                      ... and {payrollRecords.length - 20} more payroll records
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No validated trips or payroll records yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Trips must have: plate number, date, driver, and receipt number to be counted</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Compliance Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Compliance Records</CardTitle>
                <CardDescription>Site cleanup and vehicle condition checks</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search site or truck..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="max-w-xs"
                />
                <Select value={status ?? "all"} onValueChange={(v) => setStatus(v === "all" ? undefined : v)}>
                  <SelectTrigger className="min-w-[220px] md:min-w-[240px]">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="Compliant">Compliant</SelectItem>
                    <SelectItem value="Needs Review">Needs Review</SelectItem>
                    <SelectItem value="Non-Compliant">Non-Compliant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Create Compliance Check */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <h3 className="font-semibold mb-4 text-foreground text-base">Add Compliance Check</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Site</Label>
                  <Input value={site} onChange={(e) => setSite(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Truck #</Label>
                  <Input value={truck} onChange={(e) => setTruck(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Compliant">Compliant</SelectItem>
                      <SelectItem value="Needs Review">Needs Review</SelectItem>
                      <SelectItem value="Non-Compliant">Non-Compliant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</Label>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" />
                </div>
                <Button
                  onClick={async () => {
                    if (!site || !truck) return
                    await createComplianceCheck({ site, truck_id: null as any, truck_number: truck, status: newStatus as any, notes })
                    setSite("")
                    setTruck("")
                    setNewStatus("Compliant")
                    setNotes("")
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-3 py-2 text-sm whitespace-nowrap"
                >
                  Save Check
                </Button>
              </div>
            </div>
            
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow className="border-border">
                    <TableHead className="text-foreground">Date</TableHead>
                    <TableHead className="text-foreground">Site</TableHead>
                    <TableHead className="text-foreground">Truck</TableHead>
                    <TableHead className="text-foreground">Notes</TableHead>
                    <TableHead className="text-center text-foreground">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {showLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i} className="border-border">
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24 mx-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : checks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No compliance checks found
                      </TableCell>
                    </TableRow>
                  ) : (
                    checks.map((check) => (
                      <TableRow key={check.id} className="border-border hover:bg-muted/50">
                        <TableCell className="text-foreground text-sm">
                          {new Date(check.last_check).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">{check.site}</TableCell>
                        <TableCell className="text-foreground">{check.truck_number}</TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                          {check.notes || '—'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Select
                            value={check.status}
                            onValueChange={async (value) => {
                              await updateComplianceCheck(check.id, { status: value as any })
                              window.location.reload()
                            }}
                          >
                            <SelectTrigger className="min-w-[180px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Compliant">Compliant</SelectItem>
                              <SelectItem value="Needs Review">Needs Review</SelectItem>
                              <SelectItem value="Non-Compliant">Non-Compliant</SelectItem>
                            </SelectContent>
                          </Select>
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
