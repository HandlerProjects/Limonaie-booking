import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const roomId = formData.get('room_id') as string

    if (!file || !roomId) {
      return NextResponse.json({ error: 'Manca file o room_id' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${roomId}/${Date.now()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await getSupabaseAdmin()
      .storage
      .from('room-photos')
      .upload(path, buffer, { contentType: file.type, upsert: false })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: { publicUrl } } = getSupabaseAdmin()
      .storage
      .from('room-photos')
      .getPublicUrl(path)

    const { data: room } = await getSupabaseAdmin()
      .from('rooms').select('photos').eq('id', roomId).single()

    const currentPhotos: string[] = room?.photos || []
    await getSupabaseAdmin()
      .from('rooms').update({ photos: [...currentPhotos, publicUrl] }).eq('id', roomId)

    return NextResponse.json({ url: publicUrl })
  } catch (e) {
    console.error('Photo upload error:', e)
    return NextResponse.json({ error: 'Errore upload' }, { status: 500 })
  }
}
