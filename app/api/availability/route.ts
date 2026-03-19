import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const room_id = searchParams.get('room_id')
  const check_in = searchParams.get('check_in')
  const check_out = searchParams.get('check_out')

  if (!room_id || !check_in || !check_out) {
    return NextResponse.json({ error: 'Parametri mancanti.' }, { status: 400 })
  }

  const { data: conflicting, error } = await getSupabaseAdmin()
    .from('bookings')
    .select('id')
    .eq('room_id', room_id)
    .neq('status', 'cancelled')
    .lt('check_in', check_out)
    .gt('check_out', check_in)

  if (error) {
    return NextResponse.json({ error: 'Errore del server.' }, { status: 500 })
  }

  return NextResponse.json({ available: !conflicting || conflicting.length === 0 })
}
