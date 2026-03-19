import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const room_id = searchParams.get('room_id')

  if (!room_id) {
    return NextResponse.json({ error: 'room_id required' }, { status: 400 })
  }

  const { data, error } = await getSupabaseAdmin()
    .from('bookings')
    .select('check_in, check_out')
    .eq('room_id', room_id)
    .neq('status', 'cancelled')

  if (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }

  return NextResponse.json({ ranges: data || [] })
}
