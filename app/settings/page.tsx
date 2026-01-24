"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useSites, createSite, updateSite, deleteSite } from "@/hooks/use-supabase-data"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsPage() {
  const router = useRouter()
  const { sites, loading: sitesLoading } = useSites()
  const [isAddingSite, setIsAddingSite] = useState(false)
  const [editingSiteId, setEditingSiteId] = useState<number | null>(null)
  const [siteForm, setSiteForm] = useState({
    name: "",
    location: "",
    status: "Active",
    description: "",
    pricePerUnit: "",
    unitType: "CBM",
  })
  
  // System settings state
  const [systemSettings, setSystemSettings] = useState({
    companyName: "EcoHaul Mining Operations",
    timezone: "ph",
    currency: "php"
  })
  const [savingSettings, setSavingSettings] = useState(false)

  const handleAddSite = async () => {
    if (!siteForm.name || !siteForm.location) {
      alert("Please enter site name and location")
      return
    }

    try {
      await createSite(siteForm)
      setSiteForm({ name: "", location: "", status: "Active", description: "", pricePerUnit: "", unitType: "CBM" })
      setIsAddingSite(false)
      window.location.reload()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to add site")
    }
  }

  const handleUpdateSite = async () => {
    if (!editingSiteId) return

    try {
      await updateSite(editingSiteId, siteForm)
      setSiteForm({ name: "", location: "", status: "Active", description: "", pricePerUnit: "", unitType: "CBM" })
      setEditingSiteId(null)
      window.location.reload()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update site")
    }
  }

  const handleDeleteSite = async (id: number) => {
    if (!confirm("Are you sure you want to delete this site?")) return

    try {
      await deleteSite(id)
      window.location.reload()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete site")
    }
  }

  const startEdit = (site: any) => {
    setEditingSiteId(site.id)
    setSiteForm({
      name: site.name,
      location: site.location,
      status: site.status,
      description: site.description || "",
      pricePerUnit: site.pricePerUnit || "",
      unitType: site.unitType || "CBM",
    })
  }

  const cancelEdit = () => {
    setEditingSiteId(null)
    setIsAddingSite(false)
    setSiteForm({ name: "", location: "", status: "Active", description: "", pricePerUnit: "", unitType: "CBM" })
  }

  const handleSaveSettings = () => {
    setSavingSettings(true)
    // Store in localStorage
    localStorage.setItem('systemSettings', JSON.stringify(systemSettings))
    setTimeout(() => {
      setSavingSettings(false)
      alert('Settings saved successfully!')
    }, 500)
  }

  useEffect(() => {
    // Load settings from localStorage
    const stored = localStorage.getItem('systemSettings')
    if (stored) {
      setSystemSettings(JSON.parse(stored))
    }
  }, [])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Configure system rates and user roles</p>
        </div>

        {/* Billing Formula Info */}
        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-200">Payroll Calculation Formula</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-blue-900 dark:text-blue-200">
            <div className="font-semibold text-lg">
              TOTAL COST = TRIPS × PRICE/UNIT × VOLUME
            </div>
            <div className="text-sm space-y-2">
              <p>• <strong>TRIPS:</strong> Number of trips completed by the driver</p>
              <p>• <strong>PRICE/UNIT:</strong> Site-specific rate per CBM or TON (configured per site)</p>
              <p>• <strong>VOLUME:</strong> Net truck capacity = Dump Box Capacity × 0.95 (5% reduction factor)</p>
            </div>
            <div className="mt-3 p-3 bg-blue-100 dark:bg-blue-900/50 rounded text-xs">
              <strong>Example:</strong> 5 trips × ₱281.69/CBM × 20.26 CBM = ₱28,543.37
            </div>
          </CardContent>
        </Card>

        <Separator className="bg-border" />

        {/* Site Management */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Site Management</CardTitle>
                <CardDescription>Manage mining sites for billing and payroll tracking</CardDescription>
              </div>
              <Button
                onClick={() => setIsAddingSite(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Site
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {sitesLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <div className="space-y-4">
                {(isAddingSite || editingSiteId) && (
                  <div className="p-4 border border-primary/50 rounded-lg bg-muted/30 space-y-4">
                    <h3 className="font-semibold text-foreground">
                      {editingSiteId ? "Edit Site" : "Add New Site"}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="site-name">Site Name *</Label>
                        <Input
                          id="site-name"
                          value={siteForm.name}
                          onChange={(e) => setSiteForm({ ...siteForm, name: e.target.value })}
                          placeholder="e.g., North Mine"
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="site-location">Location *</Label>
                        <Input
                          id="site-location"
                          value={siteForm.location}
                          onChange={(e) => setSiteForm({ ...siteForm, location: e.target.value })}
                          placeholder="e.g., Sector A, Zone 5"
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="site-status">Status</Label>
                        <Select
                          value={siteForm.status}
                          onValueChange={(value) => setSiteForm({ ...siteForm, status: value })}
                        >
                          <SelectTrigger id="site-status" className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="site-description">Description</Label>
                        <Input
                          id="site-description"
                          value={siteForm.description}
                          onChange={(e) => setSiteForm({ ...siteForm, description: e.target.value })}
                          placeholder="Optional notes"
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="price-per-unit">Price Per Unit (₱) *</Label>
                        <Input
                          id="price-per-unit"
                          type="number"
                          step="0.01"
                          value={siteForm.pricePerUnit}
                          onChange={(e) => setSiteForm({ ...siteForm, pricePerUnit: e.target.value })}
                          placeholder="e.g., 281.69"
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="unit-type">Unit Type *</Label>
                        <Select
                          value={siteForm.unitType}
                          onValueChange={(value) => setSiteForm({ ...siteForm, unitType: value })}
                        >
                          <SelectTrigger id="unit-type" className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CBM">CBM (Cubic Meters)</SelectItem>
                            <SelectItem value="TON">TON (Metric Tons)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={editingSiteId ? handleUpdateSite : handleAddSite}
                        className="bg-accent text-accent-foreground hover:bg-accent/90"
                      >
                        {editingSiteId ? "Update Site" : "Save Site"}
                      </Button>
                      <Button variant="outline" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {sites.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No sites configured. Click "Add Site" to get started.
                  </div>
                ) : (
                  <div className="border border-border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted">
                        <TableRow className="border-border">
                          <TableHead className="text-foreground">Site Name</TableHead>
                          <TableHead className="text-foreground">Location</TableHead>
                          <TableHead className="text-foreground">Price/Unit</TableHead>
                          <TableHead className="text-foreground">Unit Type</TableHead>
                          <TableHead className="text-foreground">Status</TableHead>
                          <TableHead className="text-right text-foreground">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sites.map((site) => (
                          <TableRow key={site.id} className="border-border">
                            <TableCell className="font-medium text-foreground">{site.name}</TableCell>
                            <TableCell className="text-foreground">{site.location}</TableCell>
                            <TableCell className="text-foreground">₱{site.pricePerUnit?.toFixed(2) || "—"}</TableCell>
                            <TableCell className="text-foreground">{site.unitType || "—"}</TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                                  site.status === "Active"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                                }`}
                              >
                                {site.status}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startEdit(site)}
                                  className="hover:bg-muted"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteSite(site.id)}
                                  className="hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Separator className="bg-border" />

        {/* Role Management */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>User Roles & Permissions</CardTitle>
            <CardDescription>Manage access levels for system users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">Admin</h3>
                    <p className="text-sm text-muted-foreground">Full system access and management</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border text-foreground hover:bg-input bg-transparent"
                      onClick={() => router.push('/settings/roles')}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border text-foreground hover:bg-input bg-transparent"
                      onClick={() => router.push('/settings/users')}
                    >
                      Manage
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">Driver</h3>
                    <p className="text-sm text-muted-foreground">View personal trips and earnings</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border text-foreground hover:bg-input bg-transparent"
                      onClick={() => router.push('/settings/roles')}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border text-foreground hover:bg-input bg-transparent"
                      onClick={() => router.push('/settings/users')}
                    >
                      Manage
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">Supervisor</h3>
                    <p className="text-sm text-muted-foreground">View all data and generate reports</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border text-foreground hover:bg-input bg-transparent"
                      onClick={() => router.push('/settings/roles')}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border text-foreground hover:bg-input bg-transparent"
                      onClick={() => router.push('/settings/users')}
                    >
                      Manage
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                className="bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={() => router.push('/settings/roles')}
              >
                Add New Role
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/settings/users')}
              >
                Manage Users
              </Button>
            </div>
          </CardContent>
        </Card>

        <Separator className="bg-border" />

        {/* System Settings */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
            <CardDescription>General application configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="company-name" className="text-foreground">
                Company Name
              </Label>
              <Input
                id="company-name"
                value={systemSettings.companyName}
                onChange={(e) => setSystemSettings({ ...systemSettings, companyName: e.target.value })}
                className="mt-2 bg-input text-foreground border-border"
              />
            </div>

            <div>
              <Label htmlFor="timezone" className="text-foreground">
                Time Zone
              </Label>
              <Select 
                value={systemSettings.timezone}
                onValueChange={(value) => setSystemSettings({ ...systemSettings, timezone: value })}
              >
                <SelectTrigger id="timezone" className="mt-2 bg-input text-foreground border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="ph">Philippine Time (PHT)</SelectItem>
                  <SelectItem value="us">Eastern Time (EST)</SelectItem>
                  <SelectItem value="uk">Greenwich Mean Time (GMT)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="currency" className="text-foreground">
                Currency
              </Label>
              <Select 
                value={systemSettings.currency}
                onValueChange={(value) => setSystemSettings({ ...systemSettings, currency: value })}
              >
                <SelectTrigger id="currency" className="mt-2 bg-input text-foreground border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="php">Philippine Peso (₱)</SelectItem>
                  <SelectItem value="usd">US Dollar ($)</SelectItem>
                  <SelectItem value="eur">Euro (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {savingSettings ? 'Saving...' : 'Save Settings'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
