import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'
import { guestConfirmEmail, guestCancelEmail } from '@/lib/emailTemplates'

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = request.cookies.get('admin_session')
  if (!session || session.value !== 'authenticated') {
    return NextResponse.json({ error: 'Non autorizzato.' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Stato non valido.' }, { status: 400 })
    }

    const { data: booking, error: fetchError } = await getSupabaseAdmin()
      .from('bookings')
      .select('*, rooms(name)')
      .eq('id', id)
      .single()

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Prenotazione non trovata.' }, { status: 404 })
    }

    const { data: updated, error } = await getSupabaseAdmin()
      .from('bookings')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Aggiornamento fallito.' }, { status: 500 })
    }

    const fmtLong = (d: string) =>
      new Date(d + 'T00:00:00').toLocaleDateString('it-IT', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    const fmtShort = (d: string) =>
      new Date(d + 'T00:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' })

    const roomName = (booking.rooms as any)?.name || '—'
    const nights = Math.round(
      (new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / (1000 * 60 * 60 * 24)
    )
    const priceFormatted = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(booking.total_price)
    const resend = new Resend(process.env.RESEND_API_KEY)

    if (status === 'confirmed') {
      try {
        await resend.emails.send({
          from: 'Le Limonaie <onboarding@resend.dev>',
          to: booking.guest_email,
          subject: '✅ Prenotazione confermata — Le Limonaie',
          html: guestConfirmEmail({
            guestName: booking.guest_name,
            roomName,
            checkIn: fmtLong(booking.check_in),
            checkOut: fmtLong(booking.check_out),
            nights,
            price: priceFormatted,
          }),
        })
      } catch (e) {
        console.error('Confirm email error:', e)
      }

      await sendTelegram(
        `✅ <b>Confermata</b> — ${booking.guest_name}\n` +
        `📍 ${roomName} · ${fmtShort(booking.check_in)} → ${fmtShort(booking.check_out)}\n` +
        `Email di conferma inviata all'ospite.`
      )
    }

    if (status === 'cancelled') {
      try {
        await resend.emails.send({
          from: 'Le Limonaie <onboarding@resend.dev>',
          to: booking.guest_email,
          subject: 'Prenotazione — Le Limonaie',
          html: guestCancelEmail({
            guestName: booking.guest_name,
            roomName,
            checkIn: fmtLong(booking.check_in),
            checkOut: fmtLong(booking.check_out),
          }),
        })
      } catch (e) {
        console.error('Cancel email error:', e)
      }

      await sendTelegram(
        `❌ <b>Cancellata</b> — ${booking.guest_name}\n` +
        `📍 ${roomName} · ${fmtShort(booking.check_in)} → ${fmtShort(booking.check_out)}\n` +
        `Email di cancellazione inviata all'ospite.`
      )
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PATCH booking error:', error)
    return NextResponse.json({ error: 'Errore del server.' }, { status: 500 })
  }
}
