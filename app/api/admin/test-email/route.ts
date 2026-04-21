import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function GET() {
  const user = process.env.OWNER_EMAIL
  const pass = process.env.GMAIL_APP_PASSWORD

  if (!user || !pass) {
    return NextResponse.json({ error: 'Variables de entorno no configuradas', user: !!user, pass: !!pass })
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
    })

    await transporter.sendMail({
      from: `"Le Limonaie Test" <${user}>`,
      to: user,
      subject: '✅ Test email Le Limonaie',
      text: 'Si recibes esto, el sistema de email funciona correctamente.',
    })

    return NextResponse.json({ ok: true, message: 'Email enviado a ' + user })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message, code: err.code })
  }
}
