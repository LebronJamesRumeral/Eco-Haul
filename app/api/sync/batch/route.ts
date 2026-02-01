import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json()

    if (!type || !data || !Array.isArray(data)) {
      return NextResponse.json(
        { error: 'Missing type or data array' },
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
      case 'gps': {
        // Batch insert GPS locations
        console.log(`Batch inserting ${data.length} GPS locations`)
        
        const { error } = await supabase
          .from('driver_locations')
          .insert(data)

        if (error) {
          console.error('Batch GPS insert error:', error)
          throw error
        }
        
        return NextResponse.json({ 
          success: true, 
          count: data.length,
          message: `Successfully inserted ${data.length} GPS locations`
        })
      }

      case 'trip': {
        // Batch insert trips
        console.log(`Batch inserting ${data.length} trips`)
        
        const { error } = await supabase
          .from('trips')
          .insert(data)

        if (error) {
          console.error('Batch trip insert error:', error)
          throw error
        }
        
        return NextResponse.json({ 
          success: true, 
          count: data.length,
          message: `Successfully inserted ${data.length} trips`
        })
      }

      case 'payroll': {
        // Batch insert payroll records
        console.log(`Batch inserting ${data.length} payroll records`)
        
        const { error } = await supabase
          .from('payroll_records')
          .insert(data)

        if (error) {
          console.error('Batch payroll insert error:', error)
          throw error
        }
        
        return NextResponse.json({ 
          success: true, 
          count: data.length,
          message: `Successfully inserted ${data.length} payroll records`
        })
      }

      default:
        return NextResponse.json(
          { error: `Unknown operation type: ${type}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Batch sync error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Batch sync failed' },
      { status: 500 }
    )
  }
}
