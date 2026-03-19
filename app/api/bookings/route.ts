import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'
import { calculateTotalPrice } from '@/lib/pricing'
import { Room } from '@/lib/types'
import { generateActionToken } from '@/lib/token'
import { ownerNotificationEmail } from '@/lib/emailTemplates'

async function sendTelegram(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    })
  } catch (e) {
    console.error('Telegram error:', e)
  }
}

export async function POST(request: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    const body = await request.json()
    const { room_id, guest_name, guest_email, guest_phone, check_in, check_out, notes } = body

    if (!room_id || !guest_name || !guest_email || !guest_phone || !check_in || !check_out) {
      return NextResponse.json({ error: 'Tutti i campi obbligatori devono essere compilati.' }, { status: 400 })
    }

    const checkInDate = new Date(check_in)
    const checkOutDate = new Date(check_out)
    const nights = Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
    if (nights < 2) {
      return NextResponse.json({ error: 'Il soggiorno minimo è di 2 notti.' }, { status: 400 })
    }

    const { data: conflicting } = await getSupabaseAdmin()
      .from('bookings')
      .select('id')
      .eq('room_id', room_id)
      .neq('status', 'cancelled')
      .lt('check_in', check_out)
      .gt('check_out', check_in)

    if (conflicting && conflicting.length > 0) {
      return NextResponse.json(
        { error: 'Le date selezionate non sono disponibili. Scegli altre date.' },
        { status: 409 }
      )
    }

    const { data: roomData, error: roomError } = await getSupabaseAdmin()
      .from('rooms')
      .select('*, properties(*)')
      .eq('id', room_id)
      .single()

    if (roomError || !roomData) {
      return NextResponse.json({ error: 'Camera non trovata.' }, { status: 404 })
    }

    const room = roomData as Room
    const total_price = calculateTotalPrice(checkInDate, checkOutDate, room)

    const { data: booking, error: insertError } = await getSupabaseAdmin()
      .from('bookings')
      .insert({
        room_id,
        guest_name,
        guest_email,
        guest_phone,
        check_in,
        check_out,
        notes: notes || null,
        status: 'pending',
        total_price,
      })
      .select()
      .single()

    if (insertError || !booking) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Errore durante la prenotazione. Riprova.' }, { status: 500 })
    }

    const fmtLong = (d: string) =>
      new Date(d + 'T00:00:00').toLocaleDateString('it-IT', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    const fmtShort = (d: string) =>
      new Date(d + 'T00:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' })

    const priceFormatted = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(total_price)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // One-click action URLs (no login required)
    const confirmToken = generateActionToken(booking.id, 'confirmed')
    const cancelToken = generateActionToken(booking.id, 'cancelled')
    const confirmUrl = `${siteUrl}/api/admin/quick-action?id=${booking.id}&action=confirmed&token=${confirmToken}`
    const cancelUrl = `${siteUrl}/api/admin/quick-action?id=${booking.id}&action=cancelled&token=${cancelToken}`

    // Beautiful HTML email to owner with one-click buttons
    try {
      await resend.emails.send({
        from: 'Le Limonaie Sistema <onboarding@resend.dev>',
        to: process.env.OWNER_EMAIL || 'info@lelimonaieamare.it',
        subject: `🍋 Nuova prenotazione — ${guest_name} — ${fmtShort(check_in)}`,
        html: ownerNotificationEmail({
          guestName: guest_name,
          guestPhone: guest_phone,
          guestEmail: guest_email,
          roomName: room.name,
          checkIn: fmtLong(check_in),
          checkOut: fmtLong(check_out),
          nights,
          price: priceFormatted,
          notes,
          confirmUrl,
          cancelUrl,
          siteUrl,
        }),
      })
    } catch (emailError) {
      console.error('Owner email error:', emailError)
    }

    // Telegram instant notification (if configured)
    await sendTelegram(
      `🍋 <b>Nuova richiesta di prenotazione!</b>\n\n` +
      `👤 <b>${guest_name}</b>\n` +
      `📱 ${guest_phone}\n` +
      `✉️ ${guest_email}\n\n` +
      `📍 <b>${room.name}</b>\n` +
      `📅 ${fmtShort(check_in)} → ${fmtShort(check_out)} (${nights} nott${nights === 1 ? 'e' : 'i'})\n` +
      `💶 <b>${priceFormatted}</b>\n` +
      (notes ? `📝 ${notes}\n` : '') +
      `\n<a href="${siteUrl}/admin">Apri pannello admin →</a>`
    )

    // Receipt email to guest
    try {
      await resend.emails.send({
        from: 'Le Limonaie <onboarding@resend.dev>',
        to: guest_email,
        subject: 'Richiesta ricevuta — Le Limonaie',
        text:
          `Gentile ${guest_name},\n\n` +
          `Abbiamo ricevuto la sua richiesta di prenotazione. La contatteremo presto per confermarla.\n\n` +
          `Camera: ${room.name}\n` +
          `Check-in: ${fmtLong(check_in)}\n` +
          `Check-out: ${fmtLong(check_out)}\n` +
          `Totale stimato: ${priceFormatted}\n\n` +
          `Per qualsiasi necessità:\n` +
          `Tel: +39 339 59 66 527\n\n` +
          `— Lo staff di Le Limonaie`,
      })
    } catch (emailError) {
      console.error('Guest email error:', emailError)
    }

    return NextResponse.json({ id: booking.id, total_price }, { status: 200 })
  } catch (error) {
    console.error('Booking error:', error)
    return NextResponse.json({ error: 'Errore del server. Riprova più tardi.' }, { status: 500 })
  }
}
