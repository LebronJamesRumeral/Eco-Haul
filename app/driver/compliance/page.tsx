'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useDriverData, useDriverComplianceRecords, createComplianceCheck } from '@/hooks/use-supabase-data'
import { CheckCircle2, AlertCircle, ClipboardCheck } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function DriverCompliancePage() {
  const router = useRouter()
  const { user, loading: authLoading, isDriver } = useAuth()
  const { driver, truck, loading: driverLoading } = useDriverData(user?.driver_id)
  const { records, loading: recordsLoading, refetch } = useDriverComplianceRecords(user?.driver_id)
  
  const [site, setSite] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!authLoading && (!user || !isDriver)) {
      router.push('/login')
    }
  }, [authLoading, user, isDriver, router])

  if (authLoading || driverLoading) {
    return (
      <DashboardLayout>
        <Skeleton className="h-screen w-full" />
      </DashboardLayout>
    )
  }

  if (!user || !isDriver) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!site.trim()) {
      alert('Please enter a site location')
      return
    }

    if (!truck) {
      alert('No truck assigned. Please contact admin.')
      return
    }

    setSubmitting(true)
    try {
      await createComplianceCheck({
        site: site.trim(),
        truck_id: truck.id,
        truck_number: truck.truck_number,
        last_check: new Date().toISOString(),
        status: 'Needs Review',
        notes: notes.trim() || undefined,
      })
      
      setSite('')
      setNotes('')
      alert('Compliance report submitted successfully!')
      refetch()
    } catch (err) {
      console.error('Error submitting compliance:', err)
      alert('Failed to submit compliance report. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const pendingCount = records.filter(r => r.status === 'Needs Review').length
  const compliantCount = records.filter(r => r.status === 'Compliant').length
  const nonCompliantCount = records.filter(r => r.status === 'Non-Compliant').length

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Cleanup Compliance</h1>
          <p className="text-muted-foreground">Submit site cleanup reports for review</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              {recordsLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-amber-500">{pendingCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">Awaiting admin review</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              {recordsLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-500">{compliantCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">Compliant reports</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Non-Compliant</CardTitle>
            </CardHeader>
            <CardContent>
              {recordsLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-red-500">{nonCompliantCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">Needs attention</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Submit Compliance Form */}
        <Card className="bg-card border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              Submit Cleanup Report
            </CardTitle>
            <CardDescription>Report site cleanup completion after each trip</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="truck">Assigned Truck</Label>
                  <Input
                    id="truck"
                    value={truck?.truck_number || 'No truck assigned'}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="site">Site Location *</Label>
                  <Input
                    id="site"
                    placeholder="e.g., Mining Site A, Dumping Area 3"
                    value={site}
                    onChange={(e) => setSite(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional details about the cleanup..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                type="submit"
                disabled={submitting || !truck}
                className="w-full md:w-auto"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Compliance History */}
        <Card className="bg-card border-border/60">
          <CardHeader>
            <CardTitle>My Compliance History</CardTitle>
            <CardDescription>Track your submitted cleanup reports and their status</CardDescription>
          </CardHeader>
          <CardContent>
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
                  {recordsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i} className="border-border">
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24 mx-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No compliance reports submitted yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map((record) => (
                      <TableRow key={record.id} className="border-border hover:bg-muted/50">
                        <TableCell className="text-foreground">
                          {new Date(record.last_check).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">{record.site}</TableCell>
                        <TableCell className="text-foreground">{record.truck_number}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {record.notes || '—'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              record.status === 'Compliant'
                                ? 'default'
                                : record.status === 'Needs Review'
                                ? 'secondary'
                                : 'destructive'
                            }
                            className="flex items-center gap-1 justify-center w-fit mx-auto"
                          >
                            {record.status === 'Compliant' ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : record.status === 'Needs Review' ? (
                              <AlertCircle className="h-3 w-3" />
                            ) : (
                              <AlertCircle className="h-3 w-3" />
                            )}
                            {record.status}
                          </Badge>
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
