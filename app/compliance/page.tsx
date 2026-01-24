"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useComplianceChecks, createComplianceCheck, updateComplianceCheck } from "@/hooks/use-supabase-data"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function CompliancePage() {
  const router = useRouter()
  const { user, loading: authLoading, isAdmin } = useAuth()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<string | undefined>(undefined)
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
  const { checks, loading } = useComplianceChecks(debounced, status as any)
  const [site, setSite] = useState("")
  const [truck, setTruck] = useState("")
  const [newStatus, setNewStatus] = useState("Compliant")
  const [notes, setNotes] = useState("")
  
  const totalChecks = checks.length
  const compliantCount = checks.filter(c => c.status === 'Compliant').length
  const needsReviewCount = checks.filter(c => c.status === 'Needs Review').length
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Cleanup Compliance (Admin)</h1>
          <p className="text-muted-foreground">Review and update driver-submitted cleanup compliance reports</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Checks</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
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
              {loading ? (
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
              {loading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-destructive">{needsReviewCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">Action required</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

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
          <CardContent>
            {/* Create Compliance Check */}
            <div className="mb-4 p-4 border border-border rounded-lg">
              <h3 className="font-semibold mb-3 text-foreground">Add Compliance Check</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <Label>Site</Label>
                  <Input value={site} onChange={(e) => setSite(e.target.value)} />
                </div>
                <div>
                  <Label>Truck #</Label>
                  <Input value={truck} onChange={(e) => setTruck(e.target.value)} />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
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
                  <Label>Notes</Label>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={async () => {
                      if (!site || !truck) return
                      await createComplianceCheck({ site, truck_id: null as any, truck_number: truck, status: newStatus as any, notes })
                      setSite("")
                      setTruck("")
                      setNewStatus("Compliant")
                      setNotes("")
                    }}
                    className="bg-accent text-accent-foreground"
                  >
                    Save Check
                  </Button>
                </div>
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
                  {loading ? (
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
