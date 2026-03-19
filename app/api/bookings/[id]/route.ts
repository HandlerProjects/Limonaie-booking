import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'

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

    // Fetch full booking + room for emails
    const { data: booking, error: fetchError } = await getSupabaseAdmin()
      .from('bookings')
      .select('*, rooms(name, properties(name))')
      .eq('id', id)
      .single()

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Prenotazione non trovata.' }, { status: 404 })
    }

    // Update status
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
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    if (status === 'confirmed') {
      // Telegram to owner
      await sendTelegram(
        `✅ <b>Prenotazione confermata</b>\n\n` +
        `👤 ${booking.guest_name}\n` +
        `📍 ${roomName}\n` +
        `📅 ${fmtShort(booking.check_in)} → ${fmtShort(booking.check_out)}\n` +
        `💶 ${priceFormatted}\n\n` +
        `Email di conferma inviata all'ospite.`
      )

      // Email to guest
      const resend = new Resend(process.env.RESEND_API_KEY)
      try {
        await resend.emails.send({
          from: 'Le Limonaie <onboarding@resend.dev>',
          to: booking.guest_email,
          subject: '✅ Prenotazione confermata — Le Limonaie',
          text:
            `Ciao ${booking.guest_name}!\n\n` +
            `Siamo lieti di confermare la tua prenotazione presso Le Limonaie 🍋\n\n` +
            `📍 Camera: ${roomName}\n` +
            `📅 Check-in: ${fmtLong(booking.check_in)} dalle ore 15:00\n` +
            `📅 Check-out: ${fmtLong(booking.check_out)} entro le ore 11:00\n` +
            `🌙 Durata: ${nights} nott${nights === 1 ? 'e' : 'i'}\n` +
            `💶 Totale: ${priceFormatted}\n\n` +
            `Ti aspettiamo! Per qualsiasi info:\n` +
            `📞 +39 339 59 66 527\n` +
            `✉️ info@lelimonaieamare.it\n\n` +
            `— Lo staff di Le Limonaie`,
        })
      } catch (e) {
        console.error('Confirm email error:', e)
      }
    }

    if (status === 'cancelled') {
      // Telegram to owner
      await sendTelegram(
        `❌ <b>Prenotazione cancellata</b>\n\n` +
        `👤 ${booking.guest_name}\n` +
        `📍 ${roomName}\n` +
        `📅 ${fmtShort(booking.check_in)} → ${fmtShort(booking.check_out)}\n\n` +
        `Email di cancellazione inviata all'ospite.`
      )

      // Email to guest
      const resend = new Resend(process.env.RESEND_API_KEY)
      try {
        await resend.emails.send({
          from: 'Le Limonaie <onboarding@resend.dev>',
          to: booking.guest_email,
          subject: 'Prenotazione — Le Limonaie',
          text:
            `Ciao ${booking.guest_name},\n\n` +
            `Siamo spiacenti di comunicarti che la prenotazione per ${roomName} ` +
            `dal ${fmtLong(booking.check_in)} al ${fmtLong(booking.check_out)} ` +
            `non è purtroppo disponibile.\n\n` +
            `Ti invitiamo a contattarci per trovare una soluzione alternativa:\n` +
            `📞 +39 339 59 66 527\n` +
            `✉️ info@lelimonaieamare.it\n\n` +
            `— Lo staff di Le Limonaie`,
        })
      } catch (e) {
        console.error('Cancel email error:', e)
      }

      // Also notify owner by email
      const resend2 = new Resend(process.env.RESEND_API_KEY)
      try {
        await resend2.emails.send({
          from: 'Le Limonaie Sistema <onboarding@resend.dev>',
          to: process.env.OWNER_EMAIL || 'info@lelimonaieamare.it',
          subject: `❌ Prenotazione cancellata — ${booking.guest_name}`,
          text:
            `Prenotazione cancellata:\n\n` +
            `Ospite: ${booking.guest_name}\n` +
            `Camera: ${roomName}\n` +
            `Date: ${fmtLong(booking.check_in)} → ${fmtLong(booking.check_out)}\n\n` +
            `Pannello admin: ${siteUrl}/admin`,
        })
      } catch (e) {
        console.error('Owner cancel email error:', e)
      }
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PATCH booking error:', error)
    return NextResponse.json({ error: 'Errore del server.' }, { status: 500 })
  }
}
