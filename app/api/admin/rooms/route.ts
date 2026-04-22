import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await getSupabaseAdmin()
    .from('rooms')
    .select('*')
    .order('created_at')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { id, price_low_season, price_mid_season, price_high_season, photos } = body
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (price_low_season !== undefined) updates.price_low_season = price_low_season
  if (price_mid_season !== undefined) updates.price_mid_season = price_mid_season
  if (price_high_season !== undefined) updates.price_high_season = price_high_season
  if (photos !== undefined) updates.photos = photos

  const { error } = await getSupabaseAdmin().from('rooms').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
