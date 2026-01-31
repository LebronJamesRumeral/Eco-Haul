import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json()

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Missing type or data' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    )

    // Handle different operation types
    switch (type) {
      case 'payroll': {
        const { error } = await supabase
          .from('payroll_records')
          .insert([data])

        if (error) throw error
        return NextResponse.json({ success: true, data })
      }

      case 'billing': {
        // Similar to payroll but for billing records
        const { error } = await supabase
          .from('billing_records')
          .insert([data])

        if (error) throw error
        return NextResponse.json({ success: true, data })
      }

      case 'trip': {
        const { error } = await supabase
          .from('trips')
          .insert([data])

        if (error) throw error
        return NextResponse.json({ success: true, data })
      }

      case 'compliance': {
        const { error } = await supabase
          .from('compliance_checks')
          .insert([data])

        if (error) throw error
        return NextResponse.json({ success: true, data })
      }

      case 'gps': {
        // Handle GPS location data sync
        const { error } = await supabase
          .from('driver_locations')
          .insert([data])

        if (error) throw error
        return NextResponse.json({ success: true, data })
      }

      default:
        return NextResponse.json(
          { error: `Unknown operation type: ${type}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    )
  }
}
