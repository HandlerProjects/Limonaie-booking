import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { verifyActionToken } from '@/lib/token'
import { Resend } from 'resend'
import { guestConfirmEmail, guestCancelEmail } from '@/lib/emailTemplates'

function page(title: string, body: string, color: string) {
  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — Le Limonaie</title></head>
<body style="margin:0;padding:40px 20px;background:#F5F4F0;font-family:Georgia,serif;text-align:center;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#2D4A3E;padding:28px;text-align:center;">
      <div style="font-size:2rem;">🍋</div>
      <h1 style="color:#FDF8F0;margin:8px 0 0;font-size:1.4rem;">Le Limonaie</h1>
    </div>
    <div style="padding:40px 32px;">
      <div style="font-size:3rem;margin-bottom:16px;">${color}</div>
      <h2 style="color:#1A1A1A;margin:0 0 12px;font-size:1.3rem;">${title}</h2>
      <p style="color:#6B6B5A;margin:0 0 28px;line-height:1.7;">${body}</p>
      <a href="/admin" style="display:inline-block;background:#2D4A3E;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">
        Vai al pannello admin →
      </a>
    </div>
  </div>
</body>
</html>`
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const action = searchParams.get('action')
  const token = searchParams.get('token')

  if (!id || !action || !token) {
    return new NextResponse(page('Errore', 'Parametri mancanti.', '❌'), {
      status: 400, headers: { 'Content-Type': 'text/html' },
    })
  }

  if (!verifyActionToken(id, action, token)) {
    return new NextResponse(page('Link non valido', 'Questo link non è valido o è già stato usato.', '🔒'), {
      status: 401, headers: { 'Content-Type': 'text/html' },
    })
  }

  if (!['confirmed', 'cancelled'].includes(action)) {
    return new NextResponse(page('Errore', 'Azione non riconosciuta.', '❌'), {
      status: 400, headers: { 'Content-Type': 'text/html' },
    })
  }

  const { data: booking, error: fetchError } = await getSupabaseAdmin()
    .from('bookings')
    .select('*, rooms(name)')
    .eq('id', id)
    .single()

  if (fetchError || !booking) {
    return new NextResponse(page('Non trovata', 'Prenotazione non trovata.', '🔍'), {
      status: 404, headers: { 'Content-Type': 'text/html' },
    })
  }

  if (booking.status !== 'pending') {
    const already = booking.status === 'confirmed' ? 'già confermata' : 'già cancellata'
    return new NextResponse(
      page('Già elaborata', `Questa prenotazione è ${already}.`, booking.status === 'confirmed' ? '✅' : '❌'),
      { headers: { 'Content-Type': 'text/html' } }
    )
  }

  const { error: updateError } = await getSupabaseAdmin()
    .from('bookings')
    .update({ status: action })
    .eq('id', id)

  if (updateError) {
    return new NextResponse(page('Errore', 'Aggiornamento fallito. Riprova dal pannello admin.', '⚠️'), {
      status: 500, headers: { 'Content-Type': 'text/html' },
    })
  }

  const roomName = (booking.rooms as any)?.name || '—'
  const nights = Math.round(
    (new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / (1000 * 60 * 60 * 24)
  )
  const fmtLong = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('it-IT', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
  const priceFormatted = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(booking.total_price)

  const resend = new Resend(process.env.RESEND_API_KEY)

  if (action === 'confirmed') {
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

    return new NextResponse(
      page(
        'Prenotazione confermata!',
        `La prenotazione di <strong>${booking.guest_name}</strong> per ${roomName} (${fmtLong(booking.check_in)}) è stata confermata. Il cliente ha ricevuto un'email di conferma.`,
        '✅'
      ),
      { headers: { 'Content-Type': 'text/html' } }
    )
  }

  if (action === 'cancelled') {
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

    return new NextResponse(
      page(
        'Prenotazione rifiutata',
        `La prenotazione di <strong>${booking.guest_name}</strong> per ${roomName} è stata rifiutata. Il cliente è stato informato via email.`,
        '❌'
      ),
      { headers: { 'Content-Type': 'text/html' } }
    )
  }

  return new NextResponse(page('Fatto', 'Operazione completata.', '✓'), {
    headers: { 'Content-Type': 'text/html' },
  })
}
