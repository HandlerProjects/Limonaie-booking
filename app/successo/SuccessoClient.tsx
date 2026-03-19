'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function SuccessoClient() {
  const searchParams = useSearchParams()

  const guestName = searchParams.get('name') || ''
  const guestEmail = searchParams.get('email') || ''
  const propertyName = searchParams.get('property') || 'Le Limonaie'
  const roomName = searchParams.get('room') || ''
  const checkIn = searchParams.get('check_in') || ''
  const checkOut = searchParams.get('check_out') || ''
  const price = searchParams.get('price') || '0'

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('it-IT', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })
  }

  const formatPrice = (p: string) =>
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(Number(p))

  const nights = checkIn && checkOut
    ? Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)
    : 0

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FDF8F0' }}>
      <header style={{ backgroundColor: '#2D4A3E', padding: '1.5rem 2rem' }}>
        <Link href="/" className="font-display" style={{ color: '#FDF8F0', textDecoration: 'none', fontSize: '1.5rem', fontWeight: 700 }}>
          Le Limonaie
        </Link>
      </header>

      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center' }}>
        {/* Checkmark SVG */}
        <div style={{ marginBottom: '2rem' }}>
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ margin: '0 auto' }}>
            <circle cx="40" cy="40" r="40" fill="#4A7A6A" />
            <path d="M24 40L34 50L56 28" stroke="#FDF8F0" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1 className="font-display" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700, color: '#1A1A1A', marginBottom: '0.75rem' }}>
          Prenotazione confermata!
        </h1>
        <p style={{ color: '#6B6B5A', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '3rem' }}>
          Grazie, <strong style={{ color: '#1A1A1A' }}>{guestName}</strong>!<br />
          La tua prenotazione è stata ricevuta con successo.
        </p>

        {/* Booking summary */}
        <div style={{
          backgroundColor: '#fff', borderRadius: '1.25rem', padding: '2rem',
          border: '1px solid #f0ebe0', boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          marginBottom: '2rem', textAlign: 'left',
        }}>
          <h2 className="font-display" style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', borderBottom: '1px solid #f0ebe0', paddingBottom: '0.75rem' }}>
            Riepilogo prenotazione
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <Row label="Struttura" value={propertyName} />
            <Row label="Camera" value={roomName} />
            <Row label="Check-in" value={`${formatDate(checkIn)} (dalle 15:00)`} />
            <Row label="Check-out" value={`${formatDate(checkOut)} (entro le 11:00)`} />
            <Row label="Durata" value={`${nights} ${nights === 1 ? 'notte' : 'notti'}`} />
            <div style={{ borderTop: '1px solid #f0ebe0', paddingTop: '0.875rem', marginTop: '0.25rem' }}>
              <Row label="Totale" value={formatPrice(price)} highlight />
            </div>
          </div>
        </div>

        {/* Email notice */}
        <div style={{
          backgroundColor: '#f0f7f4', borderRadius: '0.875rem', padding: '1.25rem',
          border: '1px solid #c8e0d8', marginBottom: '2rem',
          color: '#2D4A3E', fontSize: '0.9rem', lineHeight: 1.6,
        }}>
          📧 Riceverai una email di conferma all&apos;indirizzo <strong>{guestEmail}</strong>
        </div>

        {/* Contact */}
        <div style={{
          backgroundColor: '#fef8f0', borderRadius: '0.875rem', padding: '1.25rem',
          border: '1px solid #f0e8c8', marginBottom: '3rem',
          fontSize: '0.9rem', color: '#6B6B5A', lineHeight: 1.7,
        }}>
          <p style={{ fontWeight: 600, color: '#1A1A1A', marginBottom: '0.3rem' }}>Per modifiche o cancellazioni:</p>
          <p>
            📞 <a href="tel:+393395966527" style={{ color: '#C4603C', textDecoration: 'none' }}>+39 339 59 66 527</a>
            {' · '}
            <a href="tel:+393395726514" style={{ color: '#C4603C', textDecoration: 'none' }}>+39 339 57 26 514</a>
          </p>
          <p>✉️ <a href="mailto:info@lelimonaieamare.it" style={{ color: '#C4603C', textDecoration: 'none' }}>info@lelimonaieamare.it</a></p>
        </div>

        <Link href="/" style={{ color: '#2D4A3E', textDecoration: 'none', fontWeight: 600 }}>
          ← Torna alla home
        </Link>
      </main>
    </div>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
      <span style={{ color: '#6B6B5A', fontSize: '0.9rem', flexShrink: 0 }}>{label}</span>
      <span style={{
        fontWeight: highlight ? 700 : 500,
        color: highlight ? '#C4603C' : '#1A1A1A',
        fontSize: highlight ? '1.1rem' : '0.9rem',
        textAlign: 'right',
        fontFamily: highlight ? "'IBM Plex Mono', monospace" : 'inherit',
      }}>
        {value}
      </span>
    </div>
  )
}
