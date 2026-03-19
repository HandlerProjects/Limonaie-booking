import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')

  if (!slug) {
    // Return all properties
    const { data, error } = await getSupabaseAdmin()
      .from('properties')
      .select('*, rooms(*)')
      .order('created_at')

    if (error) return NextResponse.json({ error: 'Errore del server.' }, { status: 500 })
    return NextResponse.json(data)
  }

  // Return single property with rooms
  const { data, error } = await getSupabaseAdmin()
    .from('properties')
    .select('*, rooms(*)')
    .eq('slug', slug)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Struttura non trovata.' }, { status: 404 })
  }

  return NextResponse.json(data)
}
