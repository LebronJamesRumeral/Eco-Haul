"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Download, Printer, FileSpreadsheet, Info } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { usePayrollRecords, useDrivers, useSites, useTrucks, useTrips, createPayrollRecord } from "@/hooks/use-supabase-data"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export default function BillingPage() {
  const router = useRouter()
  const { user, loading: authLoading, isAdmin } = useAuth()
  const { records, loading: recordsLoading } = usePayrollRecords()
  const { drivers } = useDrivers()
  const { sites, loading: sitesLoading } = useSites()
  const { trucks, loading: trucksLoading } = useTrucks()
  const { trips, loading: tripsLoading } = useTrips()
  
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/login')
    }
  }, [authLoading, user, isAdmin, router])
  
  const [filterDriver, setFilterDriver] = useState("")
  const [filterDate, setFilterDate] = useState("")
  const [filterSite, setFilterSite] = useState("all")
  const [isSaving, setIsSaving] = useState(false)
  const [useGPSCalculation, setUseGPSCalculation] = useState(false)
  const [gpsDistance, setGpsDistance] = useState(0)

  const [tripInputs, setTripInputs] = useState({
    driverName: "",
    driverId: 0,
    truckId: 0,
    truckNumber: "",
    tripCount: 0,
    pricePerUnit: 0,
    volume: 0, // Net capacity (after 5% reduction)
    siteId: 0,
    siteName: "",
    unitType: "CBM" as "CBM" | "TON",
  })
  
  // Site-specific default prices (can be edited per entry)
  const siteDefaultPrices: Record<string, { price: number; unitType: "CBM" | "TON" }> = {
    "North Mine": { price: 281.69, unitType: "CBM" },
    "South Pit": { price: 281.69, unitType: "CBM" },
    "East Quarry": { price: 180, unitType: "TON" },
    "West Processing": { price: 200, unitType: "CBM" },
  }

  // Handle site selection - auto-fill price from site settings
  const handleSiteChange = (siteId: number) => {
    const site = sites.find(s => s.id === siteId)
    if (site) {
      // Use site's pricePerUnit if available, otherwise use default, otherwise use 0
      const price = site.pricePerUnit !== null && site.pricePerUnit !== undefined ? site.pricePerUnit : 0
      const unitType = (site.unitType || "CBM") as "CBM" | "TON"
      
      setTripInputs({
        ...tripInputs,
        siteId,
        siteName: site.name,
        pricePerUnit: price,
        unitType: unitType,
      })
    }
  }

  // Handle truck selection - auto-fill volume (net capacity = capacity × 0.95)
  const handleTruckChange = (truckId: number) => {
    const truck = trucks.find(t => t.id === truckId)
    if (truck) {
      const netCapacity = truck.capacity * 0.95 // 5% reduction
      setTripInputs({
        ...tripInputs,
        truckId,
        truckNumber: truck.truck_number,
        volume: Number(netCapacity.toFixed(2)),
      })
    }
  }

  // Calculate GPS distance for selected driver's trips today
  useEffect(() => {
    if (tripInputs.driverId && trips) {
      const driverTrips = trips.filter(t => 
        t.driver_id === tripInputs.driverId && 
        t.distance && 
        t.distance > 0
      )
      const totalDistance = driverTrips.reduce((sum, trip) => sum + (trip.distance || 0), 0)
      setGpsDistance(totalDistance)
      
      // Auto-enable GPS calculation if distance is available
      if (totalDistance > 0 && !useGPSCalculation) {
        setUseGPSCalculation(true)
      }
    } else {
      setGpsDistance(0)
    }
  }, [tripInputs.driverId, trips])

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

  // DUAL FORMULA SYSTEM:
  // GPS-based: Total Cost = Distance × ₱50/km
  // Manual: Total Cost = Trip Count × Price Per Unit × Volume
  const calculateTotalCost = (tripCount: number, pricePerUnit: number, volume: number) => {
    return tripCount * pricePerUnit * volume
  }

  const calculateGPSCost = (distance: number) => {
    return distance * 50 // ₱50 per kilometer
  }

  const currentTotal = useGPSCalculation && gpsDistance > 0
    ? calculateGPSCost(gpsDistance)
    : calculateTotalCost(
        Number(tripInputs.tripCount) || 0,
        Number(tripInputs.pricePerUnit) || 0,
        Number(tripInputs.volume) || 0,
      )

  const generateReceipt = async () => {
    if (!tripInputs.driverName || !tripInputs.truckNumber || tripInputs.tripCount === 0) {
      alert("Please enter driver name, select truck, and enter number of trips")
      return
    }

    try {
      setIsSaving(true)
      const today = new Date().toISOString().split("T")[0]
      
      await createPayrollRecord({
        driver_id: tripInputs.driverId,
        driver_name: tripInputs.driverName,
        truck_id: tripInputs.truckId,
        truck_number: tripInputs.truckNumber,
        date: today,
        trip_count: Number(tripInputs.tripCount) || 0,
        price_per_unit: Number(tripInputs.pricePerUnit) || 0,
        volume: Number(tripInputs.volume) || 0,
        total_cost: currentTotal,
        site_id: tripInputs.siteId || undefined,
        site_name: tripInputs.siteName || undefined,
        unit_type: tripInputs.unitType,
      })

      setTripInputs({ 
        driverName: "", 
        driverId: 0, 
        truckId: 0,
        truckNumber: "",
        tripCount: 0, 
        pricePerUnit: 0,
        volume: 0,
        siteId: 0, 
        siteName: "",
        unitType: "CBM",
      })
      alert("Payroll record saved successfully!")
      window.location.reload()
    } catch (error) {
      console.error('Error saving payroll:', error)
      alert("Failed to save payroll record")
    } finally {
      setIsSaving(false)
    }
  }

  const printReceipt = (record: any) => {
    const printWindow = window.open("", "", "height=600,width=800")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Payroll Receipt</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
              .receipt { background: white; padding: 30px; border-radius: 8px; max-width: 600px; margin: auto; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1a1a1a; padding-bottom: 20px; }
              .title { font-size: 28px; font-weight: bold; color: #1a1a1a; }
              .subtitle { font-size: 14px; color: #666; margin-top: 5px; }
              .section { margin-bottom: 20px; }
              .row { display: flex; justify-content: space-between; margin: 10px 0; font-size: 14px; }
              .label { font-weight: 500; color: #333; }
              .amount { text-align: right; color: #333; }
              .breakdown-section { background: #f9f9f9; padding: 15px; border-radius: 6px; margin-bottom: 20px; }
              .breakdown-title { font-weight: bold; margin-bottom: 10px; color: #1a1a1a; font-size: 16px; }
              .breakdown-item { display: flex; justify-content: space-between; margin: 8px 0; font-size: 13px; color: #555; }
              .formula { background: #e3f2fd; padding: 12px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #2196f3; }
              .formula-text { font-family: monospace; font-size: 14px; color: #1565c0; }
              .total-section { background: linear-gradient(to right, #1a1a1a, #2a2a2a); color: white; padding: 20px; border-radius: 6px; }
              .total-label { font-size: 16px; font-weight: bold; }
              .total-amount { font-size: 28px; font-weight: bold; }
              .total-row { display: flex; justify-content: space-between; align-items: center; }
              .divider { border-bottom: 1px solid #ddd; margin: 15px 0; }
              .footer { text-align: center; font-size: 11px; color: #999; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px; }
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="header">
                <div class="title">EcoHaul</div>
                <div class="subtitle">Payroll Receipt</div>
              </div>

              <div class="section">
                <div class="row">
                  <span class="label">Driver Name:</span>
                  <span class="amount">${record.driver_name}</span>
                </div>
                ${record.truck_number ? `
                <div class="row">
                  <span class="label">Vehicle/Truck:</span>
                  <span class="amount">${record.truck_number}</span>
                </div>
                ` : ''}
                <div class="row">
                  <span class="label">Date:</span>
                  <span class="amount">${new Date(record.created_at || record.date).toLocaleString()}</span>
                </div>
                ${record.site_name ? `
                <div class="row">
                  <span class="label">Site:</span>
                  <span class="amount">${record.site_name}</span>
                </div>
                ` : ''}
              </div>

              <div class="divider"></div>

              <div class="breakdown-section">
                <div class="breakdown-title">Trip Details</div>
                <div class="breakdown-item">
                  <span>Number of Trips:</span>
                  <span><strong>${record.trip_count}</strong></span>
                </div>
                <div class="breakdown-item">
                  <span>Price per ${record.unit_type || 'CBM'}:</span>
                  <span><strong>₱${Number(record.price_per_unit).toLocaleString()}</strong></span>
                </div>
                <div class="breakdown-item">
                  <span>Volume (${record.unit_type || 'CBM'}):</span>
                  <span><strong>${Number(record.volume).toFixed(2)}</strong></span>
                </div>
              </div>

              <div class="formula">
                <div style="font-size: 12px; color: #666; margin-bottom: 5px;">CALCULATION FORMULA:</div>
                <div class="formula-text">
                  ${record.trip_count} trips × ₱${Number(record.price_per_unit).toLocaleString()} × ${Number(record.volume).toFixed(2)} ${record.unit_type || 'CBM'}
                </div>
              </div>

              <div class="total-section">
                <div class="total-row">
                  <span class="total-label">TOTAL PAYROLL</span>
                  <span class="total-amount">₱${Number(record.total_cost).toLocaleString()}</span>
                </div>
              </div>

              <div class="footer">
                <p>This is an official payroll receipt. Please keep for your records.</p>
                <p>EcoHaul Mining Operations | ${new Date().getFullYear()}</p>
              </div>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const exportToExcel = () => {
    // Create CSV content
    const headers = ["Driver Name", "Truck Number", "Date", "Site", "Trips", "Price/Unit", "Volume", "Unit Type", "Total Cost (₱)"]
    const rows = records.map((record) => [
      record.driver_name,
      record.truck_number || "N/A",
      record.date,
      record.site_name || "N/A",
      record.trip_count,
      record.price_per_unit,
      record.volume,
      record.unit_type || "CBM",
      record.total_cost,
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `driver-payroll-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredPayroll = records.filter((record) => {
    const matchesDriver = filterDriver === "" || record.driver_name.toLowerCase().includes(filterDriver.toLowerCase())
    const matchesDate = filterDate === "" || record.date === filterDate
    const matchesSite = filterSite === "all" || (record.site_id && record.site_id.toString() === filterSite)
    return matchesDriver && matchesDate && matchesSite
  })

  const groupedPayroll = filteredPayroll.reduce(
    (acc, record) => {
      const date = record.date
      if (!acc[date]) acc[date] = []
      acc[date].push(record)
      return acc
    },
    {} as Record<string, any[]>,
  )

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="border-b border-border pb-6">
          <h1 className="text-4xl font-bold text-foreground mb-2">Payroll & Billing</h1>
          <p className="text-muted-foreground text-lg">Calculate payroll based on: Trips × Price/Unit × Volume (CBM/TON)</p>
          <div className="mt-3 flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-200">
              <p className="font-semibold mb-1">Formula: TOTAL COST = TRIPS × PRICE/UNIT × VOLUME</p>
              <p className="text-xs">Volume is automatically calculated as 95% of truck dump box capacity (5% reduction factor)</p>
            </div>
          </div>
        </div>

        {/* Trip Input Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                1
              </div>
              <div>
                <CardTitle>Input Trip Details</CardTitle>
                <CardDescription>Select truck, site, and enter number of trips</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="driver-select" className="text-sm font-medium text-foreground block mb-3">
                  Driver Name *
                </Label>
                {drivers.length === 0 ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={tripInputs.driverId.toString()}
                    onValueChange={(value) => {
                      const driverId = Number(value)
                      const driver = drivers.find(d => d.id === driverId)
                      setTripInputs({ 
                        ...tripInputs, 
                        driverId, 
                        driverName: driver?.name || "" 
                      })
                    }}
                  >
                    <SelectTrigger id="driver-select" className="bg-background border-border">
                      <SelectValue placeholder="Select driver..." />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.filter(d => d.status === 'On Duty' || d.status === 'Off Duty').map((driver) => (
                        <SelectItem key={driver.id} value={driver.id.toString()}>
                          {driver.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              <div>
                <Label htmlFor="truck-select" className="text-sm font-medium text-foreground block mb-3">
                  Vehicle / Truck *
                </Label>
                {trucksLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={tripInputs.truckId.toString()}
                    onValueChange={(value) => handleTruckChange(Number(value))}
                  >
                    <SelectTrigger id="truck-select" className="bg-background border-border">
                      <SelectValue placeholder="Select truck..." />
                    </SelectTrigger>
                    <SelectContent>
                      {trucks.filter(t => t.status === 'Active').map((truck) => (
                        <SelectItem key={truck.id} value={truck.id.toString()}>
                          {truck.truck_number} - {truck.capacity} CBM
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              <div>
                <Label htmlFor="site-select" className="text-sm font-medium text-foreground block mb-3">
                  Site
                </Label>
                {sitesLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={tripInputs.siteId.toString()}
                    onValueChange={(value) => handleSiteChange(Number(value))}
                  >
                    <SelectTrigger id="site-select" className="bg-background border-border">
                      <SelectValue placeholder="Select a site..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No Site</SelectItem>
                      {sites.filter(s => s.status === 'Active').map((site) => (
                        <SelectItem key={site.id} value={site.id.toString()}>
                          {site.name} - {site.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div>
                <label htmlFor="trips" className="text-sm font-medium text-foreground block mb-3">
                  Number of Trips *
                </label>
                <Input
                  id="trips"
                  type="number"
                  placeholder="0"
                  value={tripInputs.tripCount || ""}
                  onChange={(e) => setTripInputs({ ...tripInputs, tripCount: Number(e.target.value) })}
                  className="bg-background border-border text-foreground"
                />
              </div>
            </div>

            {/* Auto-populated fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-border">
              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground block">
                  Volume ({tripInputs.unitType})
                </label>
                <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 bg-muted/50">
                  <Input
                    type="number"
                    step="0.01"
                    value={tripInputs.volume || ""}
                    onChange={(e) => setTripInputs({ ...tripInputs, volume: Number(e.target.value) })}
                    className="border-0 bg-transparent p-0 text-foreground focus:ring-0"
                  />
                  <span className="text-muted-foreground text-sm">{tripInputs.unitType}</span>
                </div>
                <p className="text-xs text-muted-foreground">Auto-filled (95% of truck capacity)</p>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground block">
                  Price per {tripInputs.unitType}
                </label>
                <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 bg-muted/50">
                  <span className="text-muted-foreground font-medium">₱</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={tripInputs.pricePerUnit || ""}
                    onChange={(e) => setTripInputs({ ...tripInputs, pricePerUnit: Number(e.target.value) })}
                    className="border-0 bg-transparent p-0 text-foreground focus:ring-0"
                  />
                  <span className="text-muted-foreground text-sm">/{tripInputs.unitType}</span>
                </div>
                <p className="text-xs text-muted-foreground">Auto-filled from site settings</p>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground block">
                  Unit Type
                </label>
                <Select
                  value={tripInputs.unitType}
                  onValueChange={(value: "CBM" | "TON") => setTripInputs({ ...tripInputs, unitType: value })}
                >
                  <SelectTrigger className="bg-muted/50 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CBM">CBM (Cubic Meter)</SelectItem>
                    <SelectItem value="TON">TON (Metric Ton)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calculation and Generate Section */}
        <Card className="border-2 border-accent bg-gradient-to-br from-card to-card/80">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent text-accent-foreground font-bold">
                2
              </div>
              <div>
                <CardTitle>Payroll Calculation</CardTitle>
                <CardDescription>
                  {useGPSCalculation && gpsDistance > 0 
                    ? '📍 GPS Formula: Distance (km) × ₱50/km' 
                    : `Formula: Trips × Price/${tripInputs.unitType} × Volume`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* GPS Distance Display & Toggle */}
            {gpsDistance > 0 && (
              <div className="p-4 rounded-lg bg-green-500/10 border-2 border-green-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="text-2xl">📍</div>
                    <div>
                      <div className="text-sm font-semibold text-green-700 dark:text-green-400">GPS Data Available</div>
                      <div className="text-xs text-muted-foreground">Automatically tracked distance from trips</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">{gpsDistance.toFixed(2)} km</div>
                      <div className="text-xs text-muted-foreground">Total Distance</div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useGPSCalculation}
                        onChange={(e) => setUseGPSCalculation(e.target.checked)}
                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                      />
                      <span className="text-sm font-medium text-foreground">Use GPS</span>
                    </label>
                  </div>
                </div>
                {useGPSCalculation && (
                  <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400 bg-green-500/10 px-3 py-2 rounded">
                    <Info size={14} />
                    <span>GPS-based calculation: {gpsDistance.toFixed(2)} km × ₱50 = ₱{calculateGPSCost(gpsDistance).toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <div className="flex justify-between items-center p-4 rounded-lg bg-background/50 border border-border">
                <div>
                  <div className="text-sm font-medium text-foreground">Number of Trips</div>
                  <div className="text-xs text-muted-foreground mt-1">Total trips completed</div>
                </div>
                <span className="text-2xl font-bold text-foreground">{tripInputs.tripCount}</span>
              </div>

              <div className="flex justify-between items-center p-4 rounded-lg bg-background/50 border border-border">
                <div>
                  <div className="text-sm font-medium text-foreground">Price per {tripInputs.unitType}</div>
                  <div className="text-xs text-muted-foreground mt-1">Rate per unit volume</div>
                </div>
                <span className="text-2xl font-bold text-accent">₱{tripInputs.pricePerUnit.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center p-4 rounded-lg bg-background/50 border border-border">
                <div>
                  <div className="text-sm font-medium text-foreground">Volume ({tripInputs.unitType})</div>
                  <div className="text-xs text-muted-foreground mt-1">Net capacity (95% of dump box)</div>
                </div>
                <span className="text-2xl font-bold text-accent">{tripInputs.volume.toFixed(2)}</span>
              </div>

              <div className="border-t-2 border-dashed border-border pt-4 my-4"></div>

              <div className="p-4 rounded-lg bg-primary/10 border-2 border-primary">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Calculation</span>
                </div>
                <div className="text-sm font-mono text-foreground mb-3">
                  {useGPSCalculation && gpsDistance > 0
                    ? `${gpsDistance.toFixed(2)} km × ₱50/km`
                    : `${tripInputs.tripCount} trips × ₱${tripInputs.pricePerUnit} × ${tripInputs.volume.toFixed(2)} ${tripInputs.unitType}`
                  }
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-foreground">Total Payroll</span>
                <span className="text-4xl font-bold text-accent">₱{currentTotal.toLocaleString()}</span>
              </div>
            </div>

            <Button
              onClick={generateReceipt}
              disabled={isSaving}
              size="lg"
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-base"
            >
              <Download size={18} className="mr-2" />
              {isSaving ? "Saving..." : "Save to Payroll History"}
            </Button>
          </CardContent>
        </Card>

        {/* GPS-Based Earnings Summary */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20 text-green-600 font-bold">
                📍
              </div>
              <div>
                <CardTitle>GPS-Based Earnings</CardTitle>
                <CardDescription>Calculated from automatically recorded trip distances</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tripsLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : trips && trips.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-background/50 border border-border">
                      <div className="text-sm text-muted-foreground mb-1">Total Trips</div>
                      <div className="text-2xl font-bold text-foreground">{trips.length}</div>
                    </div>
                    <div className="p-4 rounded-lg bg-background/50 border border-border">
                      <div className="text-sm text-muted-foreground mb-1">Total Distance</div>
                      <div className="text-2xl font-bold text-foreground">
                        {trips.reduce((sum, trip) => sum + (trip.distance || 0), 0).toFixed(2)} km
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-background/50 border border-border">
                      <div className="text-sm text-muted-foreground mb-1">Rate per km</div>
                      <div className="text-2xl font-bold text-accent">₱50</div>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/10 border-2 border-primary">
                      <div className="text-sm text-muted-foreground mb-1">Total Earnings</div>
                      <div className="text-2xl font-bold text-primary">
                        ₱{(trips.reduce((sum, trip) => sum + ((trip.distance || 0) * 50), 0)).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Trip breakdown table */}
                  <div className="border-t border-border pt-4 mt-4">
                    <h3 className="font-semibold text-foreground mb-3">Trip Breakdown</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b border-border">
                          <tr className="text-muted-foreground">
                            <th className="text-left py-2">Trip ID</th>
                            <th className="text-left py-2">Driver</th>
                            <th className="text-right py-2">Distance (km)</th>
                            <th className="text-right py-2">Cost (₱50/km)</th>
                            <th className="text-left py-2">Duration</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trips.slice(0, 10).map((trip) => (
                            <tr key={trip.id} className="border-b border-border hover:bg-background/50">
                              <td className="py-2 text-foreground">#{String(trip.id).slice(0, 8)}</td>
                              <td className="py-2 text-foreground">{trip.driver_name || 'Unknown'}</td>
                              <td className="py-2 text-right text-foreground">{(trip.distance || 0).toFixed(2)}</td>
                              <td className="py-2 text-right font-semibold text-accent">
                                ₱{((trip.distance || 0) * 50).toLocaleString()}
                              </td>
                              <td className="py-2 text-muted-foreground text-xs">{trip.duration || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {trips.length > 10 && (
                      <div className="text-center text-xs text-muted-foreground mt-2">
                        ... and {trips.length - 10} more trips
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="text-4xl mb-2">📍</div>
                  <p className="text-muted-foreground">No GPS trips recorded yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Drivers need to complete trips with GPS tracking to generate earnings</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payroll History & Filters Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
              <div>
                <CardTitle>Payroll History</CardTitle>
                <CardDescription>View and manage all driver payroll records</CardDescription>
              </div>
              {filteredPayroll.length > 0 && (
                <Button
                  onClick={exportToExcel}
                  size="sm"
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  <FileSpreadsheet size={16} className="mr-2" />
                  Export to Excel
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="filter-driver" className="text-sm font-medium text-foreground block mb-2">
                    Filter by Driver
                  </label>
                  <Input
                    id="filter-driver"
                    type="text"
                    placeholder="Search driver name..."
                    value={filterDriver}
                    onChange={(e) => setFilterDriver(e.target.value)}
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div>
                  <label htmlFor="filter-date" className="text-sm font-medium text-foreground block mb-2">
                    Filter by Date
                  </label>
                  <Input
                    id="filter-date"
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div>
                  <label htmlFor="filter-site" className="text-sm font-medium text-foreground block mb-2">
                    Filter by Site
                  </label>
                  {sitesLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select value={filterSite} onValueChange={setFilterSite}>
                      <SelectTrigger id="filter-site" className="bg-background border-border">
                        <SelectValue placeholder="All sites" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sites</SelectItem>
                        {sites.map((site) => (
                          <SelectItem key={site.id} value={site.id.toString()}>
                            {site.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </div>

            {Object.keys(groupedPayroll)
              .sort()
              .reverse()
              .map((date) => (
                <div key={date} className="mb-8">
                  <h3 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">
                    {new Date(date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </h3>
                  <div className="space-y-3">
                    {groupedPayroll[date].map((record) => (
                      <div
                        key={record.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg border border-border bg-background/50 hover:bg-background/80 transition"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="font-semibold text-foreground text-base">{record.driver_name}</div>
                            {record.truck_number && (
                              <span className="text-xs text-muted-foreground">• Truck {record.truck_number}</span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                            <span>{record.trip_count} trips</span>
                            <span>₱{record.price_per_unit}/{record.unit_type || "CBM"}</span>
                            <span>{record.volume} {record.unit_type || "CBM"}</span>
                          </div>
                          {record.site_name && (
                            <div className="mt-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
                                {record.site_name}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Total Payroll</div>
                            <div className="text-2xl font-bold text-accent">₱{record.total_cost.toLocaleString()}</div>
                          </div>
                          <Button
                            onClick={() => printReceipt(record)}
                            size="sm"
                            variant="outline"
                            className="border-border text-foreground hover:bg-background"
                          >
                            <Printer size={16} className="mr-1" />
                            Print
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

            {filteredPayroll.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-base">
                  No payroll records found. Start by creating a payroll entry above.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
