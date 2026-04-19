import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'
import nodemailer from 'nodemailer'
import { calculateTotalPrice } from '@/lib/pricing'
import { Room } from '@/lib/types'
import { generateActionToken } from '@/lib/token'
import { ownerNotificationEmail } from '@/lib/emailTemplates'

function getGmailTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.OWNER_EMAIL,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}

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

    // Confirmation email to guest via Gmail
    if (process.env.GMAIL_APP_PASSWORD) {
      try {
        const transporter = getGmailTransporter()
        await transporter.sendMail({
          from: `"Le Limonaie" <${process.env.OWNER_EMAIL}>`,
          to: guest_email,
          subject: '✅ Richiesta ricevuta — Le Limonaie',
          html: `
            <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#FDF8F0;">
              <div style="background:#2D4A3E;padding:28px 32px;text-align:center;">
                <div style="font-size:2rem;">🍋</div>
                <h1 style="color:#FDF8F0;margin:8px 0 4px;font-size:1.4rem;font-weight:700;">Le Limonaie</h1>
                <p style="color:rgba(253,248,240,0.7);margin:0;font-size:0.9rem;">San Benedetto del Tronto</p>
              </div>
              <div style="padding:32px;">
                <h2 style="color:#1A1A1A;margin:0 0 8px;font-size:1.2rem;">Gentile ${guest_name},</h2>
                <p style="color:#6B6B5A;margin:0 0 24px;line-height:1.7;">
                  Abbiamo ricevuto la sua richiesta di prenotazione.<br/>
                  La contatteremo a breve per confermarla.
                </p>
                <div style="background:#fff;border-radius:12px;padding:24px;border:1px solid #e8e4dc;margin-bottom:24px;">
                  <table style="width:100%;border-collapse:collapse;">
                    <tr><td style="color:#9B9B8A;padding:6px 0;font-size:0.85rem;width:40%">Camera</td><td style="font-weight:600;color:#1A1A1A;">${room.name}</td></tr>
                    <tr><td style="color:#9B9B8A;padding:6px 0;font-size:0.85rem;">Check-in</td><td style="color:#1A1A1A;">${fmtLong(check_in)}</td></tr>
                    <tr><td style="color:#9B9B8A;padding:6px 0;font-size:0.85rem;">Check-out</td><td style="color:#1A1A1A;">${fmtLong(check_out)}</td></tr>
                    <tr><td style="color:#9B9B8A;padding:6px 0;font-size:0.85rem;">Notti</td><td style="color:#1A1A1A;">${nights}</td></tr>
                    <tr><td style="color:#9B9B8A;padding:6px 0;font-size:0.85rem;">Totale stimato</td><td style="color:#C4603C;font-weight:700;font-size:1.05em;">${priceFormatted}</td></tr>
                  </table>
                </div>
                <p style="color:#6B6B5A;font-size:0.9rem;line-height:1.7;margin:0 0 24px;">
                  Per qualsiasi necessità non esiti a contattarci:<br/>
                  📞 <a href="tel:+393395966527" style="color:#2D4A3E;">+39 339 59 66 527</a>
                </p>
                <p style="color:#9B9B8A;font-size:0.85rem;margin:0;">
                  A presto,<br/><strong style="color:#1A1A1A;">Lo staff di Le Limonaie</strong>
                </p>
              </div>
              <div style="background:#1A1A1A;padding:16px 32px;text-align:center;">
                <p style="color:rgba(253,248,240,0.4);margin:0;font-size:0.75rem;">Le Limonaie · Via Mazzocchi 7, San Benedetto del Tronto</p>
              </div>
            </div>
          `,
        })
      } catch (emailError) {
        console.error('Guest email error:', emailError)
      }
    }

    return NextResponse.json({ id: booking.id, total_price }, { status: 200 })
  } catch (error) {
    console.error('Booking error:', error)
    return NextResponse.json({ error: 'Errore del server. Riprova più tardi.' }, { status: 500 })
  }
}
