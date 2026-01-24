import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export type Trip = {
  id: number
  date: string
  truck_id: number
  truck_number: string
  driver_id: number
  driver_name: string
  start_time: string
  end_time: string
  distance: number
  duration: string
  cost: string
  created_at?: string
}

export type Truck = {
  id: number
  truck_number: string
  plate_number: string
  capacity: number // Dump box volume (actual)
  net_capacity?: number // Capacity after reduction (capacity × 0.95)
  driver_id?: number
  driver_name?: string
  status: 'Active' | 'Inactive' | 'Maintenance'
  created_at?: string
}

export type Driver = {
  id: number
  name: string
  truck_id?: number
  truck_number?: string
  status: 'On Duty' | 'Off Duty' | 'Leave'
  trips_today: number
  distance_today: number
  created_at?: string
}

export type DashboardStats = {
  active_trucks: number
  drivers_on_duty: number
  trips_today: number
  total_distance: number
  payroll_cost: number
}

export type ComplianceCheck = {
  id: number
  site: string
  truck_id: number
  truck_number: string
  last_check: string
  status: 'Compliant' | 'Needs Review' | 'Non-Compliant'
  notes?: string
  created_at?: string
}

export type BillingRate = {
  id: number
  site_id?: number
  site_name?: string
  price_per_unit: number // Price per CBM or Ton
  unit_type: 'CBM' | 'TON'
  reduction_factor: number // e.g., 0.95 for 5% reduction
  updated_at?: string
}

export type PayrollRecord = {
  id: number
  driver_id: number
  driver_name: string
  truck_id?: number
  truck_number?: string
  date: string
  trip_count: number
  price_per_unit: number // Price per CBM or Ton at time of entry
  volume: number // CBM or Tonnage (after 5% reduction)
  total_cost: number // trip_count × price_per_unit × volume
  site_id?: number
  site_name?: string
  unit_type?: string // 'CBM' or 'TON'
  created_at?: string
}

export type Site = {
  id: number
  name: string
  location: string
  status: 'Active' | 'Inactive'
  description?: string
  pricePerUnit?: number
  unitType?: 'CBM' | 'TON'
  created_at?: string
}
