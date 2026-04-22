import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await getSupabaseAdmin().from('settings').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const result: Record<string, string> = {}
  for (const row of data || []) result[row.key] = row.value
  return NextResponse.json(result)
}

export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const entries = Object.entries(body) as [string, string][]
  for (const [key, value] of entries) {
    await getSupabaseAdmin().from('settings').upsert({ key, value })
  }
  return NextResponse.json({ ok: true })
}
