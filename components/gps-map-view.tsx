'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'

// Driver color palette - distinct colors for up to 20 drivers
const DRIVER_COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // amber
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
  '#06B6D4', // cyan
  '#6366F1', // indigo
  '#84CC16', // lime
  '#F43F5E', // rose
  '#0EA5E9', // sky
  '#A855F7', // violet
  '#22C55E', // green
  '#FACC15', // yellow
  '#7C3AED', // purple
  '#DC2626', // red
  '#059669', // emerald
  '#2563EB', // blue
]

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Polyline = dynamic(() => import('react-leaflet').then(mod => mod.Polyline), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })
const Tooltip = dynamic(() => import('react-leaflet').then(mod => mod.Tooltip), { ssr: false })

interface DriverLocation {
  driver_id: number
  driver_name: string
  latitude: number
  longitude: number
  timestamp: string
}

interface DriverPath {
  driver_id: number
  driver_name: string
  truck_number?: string
  color: string
  path: [number, number][]
  totalDistance: number
  currentPosition: [number, number]
}

interface GPSMapViewProps {
  driverLocations: DriverLocation[]
  showPaths?: boolean
  height?: string
}

// Haversine formula to calculate distance between two coordinates (in km)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function GPSMapView({ driverLocations, showPaths = true, height = '500px' }: GPSMapViewProps) {
  const [isClient, setIsClient] = useState(false)
  const [driverPaths, setDriverPaths] = useState<Map<number, DriverPath>>(new Map())
  const [L, setL] = useState<any>(null)

  useEffect(() => {
    setIsClient(true)
    // Import Leaflet on client side only
    import('leaflet').then((leaflet) => {
      setL(leaflet.default)
    })
  }, [])

  // Create colored pin icon for marker with sharp end
  const getColoredIcon = (color: string) => {
    if (!L || !isClient) return undefined
    
    try {
      // Create SVG pin with sharp point
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 48" width="32" height="48">
        <!-- Pin body -->
        <path d="M 16 0 C 10 0 6 4 6 10 C 6 16 16 32 16 32 C 16 32 26 16 26 10 C 26 4 22 0 16 0 Z" 
              fill="${color}" stroke="white" stroke-width="2"/>
        <!-- Pin point -->
        <path d="M 16 32 L 12 42 L 16 48 L 20 42 Z" fill="${color}" stroke="white" stroke-width="2"/>
        <!-- Highlight/shine -->
        <circle cx="16" cy="8" r="3" fill="white" opacity="0.6"/>
      </svg>`
      
      return L.divIcon({
        html: svg,
        iconSize: [32, 48],
        iconAnchor: [16, 48],
        popupAnchor: [0, -48],
        className: 'colored-marker-pin'
      })
    } catch (err) {
      console.warn('Failed to create colored pin icon:', err)
      return undefined
    }
  }

  // Build paths for each driver
  useEffect(() => {
    const pathsMap = new Map<number, DriverPath>()

    // Group locations by driver and sort by timestamp
    const locationsByDriver = new Map<number, DriverLocation[]>()
    
    driverLocations.forEach((loc) => {
      if (!locationsByDriver.has(loc.driver_id)) {
        locationsByDriver.set(loc.driver_id, [])
      }
      locationsByDriver.get(loc.driver_id)!.push(loc)
    })

    // Build path and calculate distance for each driver
    let colorIndex = 0
    locationsByDriver.forEach((locations, driverId) => {
      // Sort by timestamp (oldest to newest)
      const sorted = locations.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )

      const path: [number, number][] = sorted.map(loc => [loc.latitude, loc.longitude])
      
      // Calculate total distance traveled
      let totalDistance = 0
      for (let i = 1; i < path.length; i++) {
        const [lat1, lon1] = path[i - 1]
        const [lat2, lon2] = path[i]
        totalDistance += calculateDistance(lat1, lon1, lat2, lon2)
      }

      // Assign color to driver (cycling through color palette)
      const color = DRIVER_COLORS[colorIndex % DRIVER_COLORS.length]
      colorIndex++

      pathsMap.set(driverId, {
        driver_id: driverId,
        driver_name: sorted[0].driver_name,
        truck_number: (sorted[0] as any).truck_number,
        color,
        path,
        totalDistance: Math.round(totalDistance * 100) / 100,
        currentPosition: path[path.length - 1], // Last known position
      })
    })

    setDriverPaths(pathsMap)
  }, [driverLocations])

  if (!isClient) {
    return <div className="w-full rounded-lg bg-muted animate-pulse" style={{ height }} />
  }

  // Don't render map components until Leaflet is fully loaded
  if (!L) {
    return <div className="w-full rounded-lg bg-muted animate-pulse" style={{ height }} />
  }

  // Determine map center based on first driver or default to Manila
  const mapCenter: [number, number] = driverPaths.size > 0
    ? Array.from(driverPaths.values())[0].currentPosition
    : [14.5995, 120.9842]

  return (
    <div className="relative">
      <MapContainer 
        center={mapCenter} 
        zoom={12} 
        style={{ height, width: '100%' }}
        className="rounded-lg border border-border/40"
      >
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
          attribution="&copy; OpenStreetMap contributors" 
        />

        {/* Render paths and markers for each driver */}
        {Array.from(driverPaths.values()).map((driverPath) => (
          <div key={driverPath.driver_id}>
            {/* Polyline path showing where driver traveled */}
            {showPaths && driverPath.path.length > 1 && (
              <Polyline
                positions={driverPath.path}
                pathOptions={{
                  color: driverPath.color,
                  weight: 4,
                  opacity: 0.7,
                  lineJoin: 'round',
                  lineCap: 'round',
                }}
              >
                <Tooltip permanent={false} direction="top">
                  <div className="text-xs">
                    <strong>{driverPath.driver_name}</strong>
                    <br />
                    Distance: {driverPath.totalDistance.toFixed(2)} km
                  </div>
                </Tooltip>
              </Polyline>
            )}

            {/* Marker at current position */}
            <Marker 
              position={driverPath.currentPosition}
              icon={getColoredIcon(driverPath.color)}
            >
              <Popup>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
                      style={{ backgroundColor: driverPath.color }}
                    />
                    <p className="font-semibold text-sm">{driverPath.driver_name}</p>
                  </div>
                  {driverPath.truck_number && (
                    <p className="text-xs text-muted-foreground">
                      Truck: {driverPath.truck_number}
                    </p>
                  )}
                  <p className="text-xs font-medium">
                    Distance Traveled: {driverPath.totalDistance.toFixed(2)} km
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {driverPath.path.length} GPS points
                  </p>
                  <a
                    href={`https://www.google.com/maps?q=${driverPath.currentPosition[0]},${driverPath.currentPosition[1]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline block mt-2"
                  >
                    Open in Google Maps →
                  </a>
                </div>
              </Popup>
            </Marker>
          </div>
        ))}
      </MapContainer>

      {/* Legend */}
      {driverPaths.size > 0 && (
        <div className="absolute top-2 right-2 bg-card/95 backdrop-blur-sm rounded-lg shadow-lg p-3 max-h-64 overflow-y-auto z-[1000] border border-border">
          <h4 className="font-semibold text-xs mb-2 text-foreground">Active Drivers</h4>
          <div className="space-y-1.5">
            {Array.from(driverPaths.values()).map((driverPath) => (
              <div key={driverPath.driver_id} className="flex items-center gap-2 text-xs">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0 border border-white shadow-sm"
                  style={{ backgroundColor: driverPath.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{driverPath.driver_name}</div>
                  <div className="text-muted-foreground">{driverPath.totalDistance.toFixed(2)} km</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
