import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'
import { calculateTotalPrice } from '@/lib/pricing'
import { Room } from '@/lib/types'

export async function POST(request: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    const body = await request.json()
    const { room_id, guest_name, guest_email, guest_phone, check_in, check_out, notes } = body

    // Validate required fields
    if (!room_id || !guest_name || !guest_email || !guest_phone || !check_in || !check_out) {
      return NextResponse.json({ error: 'Tutti i campi obbligatori devono essere compilati.' }, { status: 400 })
    }

    // Validate minimum stay
    const checkInDate = new Date(check_in)
    const checkOutDate = new Date(check_out)
    const nights = Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
    if (nights < 2) {
      return NextResponse.json({ error: 'Il soggiorno minimo è di 2 notti.' }, { status: 400 })
    }

    // Check availability (server-side, prevents race conditions)
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

    // Fetch room + property details for price calculation and emails
    const { data: roomData, error: roomError } = await getSupabaseAdmin()
      .from('rooms')
      .select('*, properties(*)')
      .eq('id', room_id)
      .single()

    if (roomError || !roomData) {
      return NextResponse.json({ error: 'Camera non trovata.' }, { status: 404 })
    }

    const room = roomData as Room
    const property = (roomData as any).properties
    const total_price = calculateTotalPrice(checkInDate, checkOutDate, room)

    // Insert booking
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

    // Format dates for emails
    const formatDateIT = (dateStr: string) =>
      new Date(dateStr + 'T00:00:00').toLocaleDateString('it-IT', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })

    const checkInFormatted = formatDateIT(check_in)
    const checkOutFormatted = formatDateIT(check_out)
    const priceFormatted = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(total_price)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // Send guest confirmation email
    try {
      await resend.emails.send({
        from: 'Le Limonaie <onboarding@resend.dev>',
        to: guest_email,
        subject: 'Prenotazione confermata — Le Limonaie ✓',
        text: `Gentile ${guest_name},

La sua prenotazione è confermata. Ecco il riepilogo:

Struttura: ${property?.name || 'Le Limonaie'}
Camera: ${room.name}
Check-in: ${checkInFormatted} (dalle ore 15:00)
Check-out: ${checkOutFormatted} (entro le ore 11:00)
Totale: ${priceFormatted}

Per qualsiasi necessità può contattarci:
Tel: +39 339 59 66 527
Email: info@lelimonaieamare.it

Non vediamo l'ora di accoglierla!

Lo staff di Le Limonaie`,
      })
    } catch (emailError) {
      console.error('Guest email error:', emailError)
    }

    // Send owner notification email
    try {
      await resend.emails.send({
        from: 'Le Limonaie Sistema <onboarding@resend.dev>',
        to: process.env.OWNER_EMAIL || 'info@lelimonaieamare.it',
        subject: `🏠 Nuova prenotazione — ${guest_name} — ${check_in}`,
        text: `Nuova prenotazione ricevuta:

Ospite: ${guest_name}
Email: ${guest_email}
Telefono: ${guest_phone}
Struttura: ${property?.name || 'Le Limonaie'}
Camera: ${room.name}
Arrivo: ${checkInFormatted}
Partenza: ${checkOutFormatted}
Totale: ${priceFormatted}
Note: ${notes || 'Nessuna'}

Vai al pannello admin per confermare:
${siteUrl}/admin`,
      })
    } catch (emailError) {
      console.error('Owner email error:', emailError)
    }

    return NextResponse.json({ id: booking.id, total_price }, { status: 200 })
  } catch (error) {
    console.error('Booking error:', error)
    return NextResponse.json({ error: 'Errore del server. Riprova più tardi.' }, { status: 500 })
  }
}
