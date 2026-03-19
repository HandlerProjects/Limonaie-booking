import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  // Check admin session cookie
  const session = request.cookies.get('admin_session')
  if (!session || session.value !== 'authenticated') {
    return NextResponse.json({ error: 'Non autorizzato.' }, { status: 401 })
  }

  const { data, error } = await getSupabaseAdmin()
    .from('bookings')
    .select('*, rooms(name, properties(name, slug))')
    .order('check_in', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Errore del server.' }, { status: 500 })
  }

  return NextResponse.json(data)
}
