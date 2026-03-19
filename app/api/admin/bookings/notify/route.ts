import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  const session = request.cookies.get('admin_session')
  if (!session || session.value !== 'authenticated') {
    return NextResponse.json({ error: 'Non autorizzato.' }, { status: 401 })
  }

  try {
    const { guest_email, guest_name, subject, message } = await request.json()

    if (!guest_email || !message) {
      return NextResponse.json({ error: 'Dati mancanti.' }, { status: 400 })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    await resend.emails.send({
      from: 'Le Limonaie <onboarding@resend.dev>',
      to: guest_email,
      subject: subject || 'Le Limonaie — Aggiornamento prenotazione',
      text: message,
    })

    // Also send a copy to owner so they have record
    await resend.emails.send({
      from: 'Le Limonaie Sistema <onboarding@resend.dev>',
      to: process.env.OWNER_EMAIL || 'info@lelimonaieamare.it',
      subject: `[Copia] Email inviata a ${guest_name || guest_email}`,
      text: `Hai inviato questo messaggio a ${guest_name} (${guest_email}):\n\n---\n${message}`,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Notify error:', error)
    return NextResponse.json({ error: 'Invio fallito.' }, { status: 500 })
  }
}
