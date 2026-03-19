'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Booking } from '@/lib/types'
import AdminCalendar from '@/app/components/AdminCalendar'

type FilterTab = 'tutte' | 'arrivo' | 'passate' | 'cancellate'
type ViewTab = 'lista' | 'calendario'

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'In attesa',  color: '#92610a', bg: '#fef3c7' },
  confirmed: { label: 'Confermata', color: '#166534', bg: '#dcfce7' },
  cancelled: { label: 'Cancellata', color: '#6B6B5A', bg: '#f1f0ec' },
}

export default function AdminPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('tutte')
  const [activeView, setActiveView] = useState<ViewTab>('lista')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [newAlert, setNewAlert] = useState(false)

  const loadBookings = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch('/api/admin/bookings')
      if (res.status === 401) { router.push('/admin/login'); return }
      const data = await res.json()
      if (Array.isArray(data)) {
        setBookings(prev => {
          const prevPending = prev.filter(b => b.status === 'pending').length
          const newPending = data.filter((b: Booking) => b.status === 'pending').length
          if (silent && newPending > prevPending) {
            setNewAlert(true)
            try {
              const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAA...') // simple beep
              audio.volume = 0.3
              audio.play().catch(() => {})
            } catch {}
          }
          return data
        })
      }
    } catch {
      setBookings([])
    } finally {
      if (!silent) setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadBookings()
    // Poll for new bookings every 30 seconds
    const interval = setInterval(() => loadBookings(true), 30000)
    return () => clearInterval(interval)
  }, [loadBookings])

  async function updateStatus(id: string, status: string) {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status: status as Booking['status'] } : b))
        if (selectedBooking?.id === id) {
          setSelectedBooking(prev => prev ? { ...prev, status: status as Booking['status'] } : null)
        }
      }
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  const today = new Date().toISOString().split('T')[0]
  const pendingCount = bookings.filter(b => b.status === 'pending').length

  // Update browser tab title with pending count
  useEffect(() => {
    document.title = pendingCount > 0
      ? `(${pendingCount}) Admin — Le Limonaie`
      : 'Admin — Le Limonaie'
  }, [pendingCount])

  const filteredBookings = bookings.filter(b => {
    if (activeFilter === 'tutte') return b.status !== 'cancelled'
    if (activeFilter === 'cancellate') return b.status === 'cancelled'
    if (activeFilter === 'arrivo') return b.check_in >= today && b.status !== 'cancelled'
    if (activeFilter === 'passate') return b.check_out < today && b.status !== 'cancelled'
    return true
  })

  const stats = {
    total: bookings.filter(b => b.status !== 'cancelled').length,
    thisMonth: bookings.filter(b => {
      const d = new Date(b.check_in)
      const now = new Date()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && b.status !== 'cancelled'
    }).length,
    nextCheckIn: bookings
      .filter(b => b.check_in >= today && b.status !== 'cancelled')
      .sort((a, b) => a.check_in.localeCompare(b.check_in))[0]?.check_in || null,
  }

  const fmt = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' })

  const fmtPrice = (p: number) =>
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(p)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F4F0' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#2D4A3E', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/" className="font-display" style={{ color: '#FDF8F0', textDecoration: 'none', fontSize: '1.4rem', fontWeight: 700 }}>
            Le Limonaie
          </Link>
          <span style={{ color: 'rgba(253,248,240,0.5)', fontSize: '0.9rem' }}>/ Admin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Notification bell */}
          <button
            onClick={() => { setActiveView('lista'); setActiveFilter('tutte'); setNewAlert(false) }}
            style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '0.4rem', color: 'rgba(253,248,240,0.7)', fontSize: '1.2rem', lineHeight: 1 }}
            title={pendingCount > 0 ? `${pendingCount} prenotazioni in attesa` : 'Nessuna prenotazione in attesa'}
          >
            🔔
            {pendingCount > 0 && (
              <span style={{
                position: 'absolute', top: '0', right: '0',
                background: newAlert ? '#ef4444' : '#C4603C',
                color: '#fff', fontSize: '0.65rem', fontWeight: 700,
                borderRadius: '9999px', minWidth: '16px', height: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 3px', lineHeight: 1,
                animation: newAlert ? 'pulse 1s infinite' : 'none',
              }}>
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={handleLogout}
            style={{ background: 'none', border: '1px solid rgba(253,248,240,0.3)', color: 'rgba(253,248,240,0.7)', padding: '0.4rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            Esci
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <StatCard label="Totale prenotazioni" value={String(stats.total)} icon="📋" />
          <StatCard label="Questo mese" value={String(stats.thisMonth)} icon="📅" />
          <StatCard label="Prossimo check-in" value={stats.nextCheckIn ? fmt(stats.nextCheckIn) : '—'} icon="🏨" />
        </div>

        {/* View toggle */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', backgroundColor: '#fff', borderRadius: '0.75rem', padding: '0.25rem', border: '1px solid #e8e4dc', marginRight: '1rem' }}>
            {[{ key: 'lista', label: '☰ Lista' }, { key: 'calendario', label: '📅 Calendario' }].map(v => (
              <button
                key={v.key}
                onClick={() => setActiveView(v.key as ViewTab)}
                style={{
                  padding: '0.45rem 1rem',
                  backgroundColor: activeView === v.key ? '#C4603C' : 'transparent',
                  color: activeView === v.key ? '#fff' : '#6B6B5A',
                  border: 'none', borderRadius: '0.5rem',
                  cursor: 'pointer', fontWeight: activeView === v.key ? 600 : 400,
                  fontSize: '0.88rem', transition: 'all 0.15s',
                }}
              >
                {v.label}
              </button>
            ))}
          </div>

          {activeView === 'lista' && (
            <>
              {[
                { key: 'tutte', label: 'Tutte' },
                { key: 'arrivo', label: 'In arrivo' },
                { key: 'passate', label: 'Passate' },
                { key: 'cancellate', label: 'Cancellate' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key as FilterTab)}
                  style={{
                    padding: '0.5rem 1.25rem',
                    backgroundColor: activeFilter === tab.key ? '#2D4A3E' : '#fff',
                    color: activeFilter === tab.key ? '#fff' : '#6B6B5A',
                    border: `1px solid ${activeFilter === tab.key ? '#2D4A3E' : '#e0dbd0'}`,
                    borderRadius: '9999px', cursor: 'pointer',
                    fontWeight: activeFilter === tab.key ? 600 : 400,
                    fontSize: '0.88rem', transition: 'all 0.15s',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </>
          )}

          <button
            onClick={loadBookings}
            style={{ marginLeft: 'auto', padding: '0.5rem 1rem', backgroundColor: 'transparent', border: '1px solid #e0dbd0', borderRadius: '9999px', cursor: 'pointer', color: '#6B6B5A', fontSize: '0.85rem' }}
          >
            ↻ Aggiorna
          </button>
        </div>

        {/* CALENDARIO VIEW */}
        {activeView === 'calendario' && (
          <div style={{ backgroundColor: '#fff', borderRadius: '1rem', padding: '2rem', border: '1px solid #e8e4dc', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#9B9B8A' }}>Caricamento...</div>
            ) : (
              <AdminCalendar bookings={bookings} />
            )}
          </div>
        )}

        {/* LISTA VIEW */}
        {activeView === 'lista' && (
          <div style={{ backgroundColor: '#fff', borderRadius: '1rem', border: '1px solid #e8e4dc', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', overflowX: 'auto' }}>
            {loading ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: '#9B9B8A' }}>Caricamento prenotazioni...</div>
            ) : filteredBookings.length === 0 ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: '#9B9B8A' }}>Nessuna prenotazione trovata.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F5F4F0', borderBottom: '1px solid #e8e4dc' }}>
                    {['Arrivo', 'Partenza', 'Camera', 'Ospite', 'Telefono', 'Totale', 'Stato', 'Azioni'].map(col => (
                      <th key={col} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#9B9B8A', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking, idx) => {
                    const isCancelled = booking.status === 'cancelled'
                    const statusInfo = STATUS_LABELS[booking.status] || STATUS_LABELS.pending
                    const roomName = (booking.rooms as any)?.name || '—'
                    const isPast = booking.check_out < today
                    const isToday = booking.check_in === today
                    const isSelected = selectedBooking?.id === booking.id

                    return (
                      <tr
                        key={booking.id}
                        onClick={() => setSelectedBooking(booking)}
                        style={{
                          borderBottom: idx < filteredBookings.length - 1 ? '1px solid #f0ece4' : 'none',
                          opacity: isCancelled ? 0.5 : 1,
                          backgroundColor: isSelected ? '#fef3e8' : isToday ? '#fef8f0' : isPast && !isCancelled ? '#fafaf8' : '#fff',
                          textDecoration: isCancelled ? 'line-through' : 'none',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s',
                        }}
                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = '#f9f6f0' }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = isToday ? '#fef8f0' : isPast && !isCancelled ? '#fafaf8' : '#fff' }}
                      >
                        <td style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap' }}>
                          <span className="font-mono-custom" style={{ fontSize: '0.85rem', color: isToday ? '#C4603C' : '#1A1A1A', fontWeight: isToday ? 700 : 400 }}>
                            {fmt(booking.check_in)}
                            {isToday && <span style={{ marginLeft: '0.4rem', fontSize: '0.7rem' }}>TODAY</span>}
                          </span>
                        </td>
                        <td style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap' }}>
                          <span className="font-mono-custom" style={{ fontSize: '0.85rem', color: '#1A1A1A' }}>{fmt(booking.check_out)}</span>
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <span style={{ fontSize: '0.85rem', color: '#1A1A1A', fontWeight: 500 }}>{roomName}</span>
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1A1A1A' }}>{booking.guest_name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#9B9B8A' }}>{booking.guest_email}</div>
                        </td>
                        <td style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap' }}>
                          <a
                            href={`tel:${booking.guest_phone}`}
                            onClick={e => e.stopPropagation()}
                            style={{ fontSize: '0.85rem', color: '#2D4A3E', textDecoration: 'none' }}
                          >
                            {booking.guest_phone}
                          </a>
                        </td>
                        <td style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap' }}>
                          <span className="font-mono-custom" style={{ fontSize: '0.9rem', fontWeight: 600, color: '#C4603C' }}>
                            {fmtPrice(booking.total_price)}
                          </span>
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <span style={{ display: 'inline-block', padding: '0.25rem 0.625rem', backgroundColor: statusInfo.bg, color: statusInfo.color, borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }} onClick={e => e.stopPropagation()}>
                            {booking.status !== 'confirmed' && booking.status !== 'cancelled' && (
                              <button
                                onClick={() => updateStatus(booking.id, 'confirmed')}
                                disabled={updatingId === booking.id}
                                style={{ padding: '0.35rem 0.75rem', backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                              >
                                Conferma
                              </button>
                            )}
                            {booking.status !== 'cancelled' && (
                              <button
                                onClick={() => { if (confirm(`Cancellare la prenotazione di ${booking.guest_name}?`)) updateStatus(booking.id, 'cancelled') }}
                                disabled={updatingId === booking.id}
                                style={{ padding: '0.35rem 0.75rem', backgroundColor: '#fef2ee', color: '#C4603C', border: '1px solid #f0c0b0', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                              >
                                Cancella
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedBooking(booking)}
                              style={{ padding: '0.35rem 0.75rem', backgroundColor: '#f0ece4', color: '#6B6B5A', border: '1px solid #e0dbd0', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                            >
                              Dettagli
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        <p style={{ textAlign: 'center', color: '#9B9B8A', fontSize: '0.8rem', marginTop: '2rem' }}>
          {activeView === 'lista' && `${filteredBookings.length} prenotazion${filteredBookings.length === 1 ? 'e' : 'i'} mostrat${filteredBookings.length === 1 ? 'a' : 'e'} · Clicca su una riga per i dettagli`}
        </p>
      </main>

      {/* Booking Detail Drawer */}
      {selectedBooking && (
        <BookingDrawer
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onUpdate={updateStatus}
          updatingId={updatingId}
        />
      )}
    </div>
  )
}

function BookingDrawer({
  booking,
  onClose,
  onUpdate,
  updatingId,
}: {
  booking: Booking
  onClose: () => void
  onUpdate: (id: string, status: string) => void
  updatingId: string | null
}) {
  const roomName = (booking.rooms as any)?.name || '—'
  const nights = Math.round(
    (new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / (1000 * 60 * 60 * 24)
  )

  const fmtLong = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('it-IT', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })

  const fmtPrice = (p: number) =>
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(p)

  const confirmMsg =
    `Ciao ${booking.guest_name}! 👋\n\n` +
    `Siamo lieti di confermare la tua prenotazione presso Le Limonaie 🍋\n\n` +
    `📍 Camera: ${roomName}\n` +
    `📅 Check-in: ${fmtLong(booking.check_in)} dalle ore 15:00\n` +
    `📅 Check-out: ${fmtLong(booking.check_out)} entro le ore 11:00\n` +
    `🌙 Durata: ${nights} nott${nights === 1 ? 'e' : 'i'}\n` +
    `💶 Totale: ${fmtPrice(booking.total_price)}\n\n` +
    `Ti aspettiamo! Per qualsiasi info siamo qui:\n` +
    `📞 +39 339 59 66 527\n\n` +
    `— Lo staff di Le Limonaie`

  const cancelMsg =
    `Ciao ${booking.guest_name},\n\n` +
    `Siamo spiacenti di comunicarti che la prenotazione per ${roomName} ` +
    `dal ${fmtLong(booking.check_in)} al ${fmtLong(booking.check_out)} ` +
    `non è purtroppo disponibile.\n\n` +
    `Ti invitiamo a contattarci per trovare una soluzione alternativa:\n` +
    `📞 +39 339 59 66 527\n` +
    `✉️ info@lelimonaieamare.it\n\n` +
    `— Lo staff di Le Limonaie`

  const [msgType, setMsgType] = useState<'confirm' | 'cancel'>('confirm')
  const [message, setMessage] = useState(confirmMsg)
  const [copied, setCopied] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    setMessage(msgType === 'confirm' ? confirmMsg : cancelMsg)
    setSent(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msgType])

  const phoneClean = booking.guest_phone.replace(/\D/g, '')
  const waLink = `https://wa.me/${phoneClean}?text=${encodeURIComponent(message)}`

  const copyMessage = async () => {
    await navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const sendEmail = async () => {
    setSending(true)
    try {
      const subject = msgType === 'confirm'
        ? '✅ Prenotazione confermata — Le Limonaie'
        : 'Prenotazione — Le Limonaie'
      const res = await fetch('/api/admin/bookings/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_email: booking.guest_email,
          guest_name: booking.guest_name,
          subject,
          message,
        }),
      })
      if (res.ok) {
        setSent(true)
        setTimeout(() => setSent(false), 4000)
      } else {
        alert('Invio fallito. Controlla Resend.')
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)',
          zIndex: 40, backdropFilter: 'blur(2px)',
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: '100%', maxWidth: '500px',
        backgroundColor: '#fff', zIndex: 50,
        overflowY: 'auto', display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 32px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #e8e4dc',
          backgroundColor: '#2D4A3E',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#FDF8F0' }}>{booking.guest_name}</div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(253,248,240,0.65)', marginTop: '0.15rem' }}>
              {roomName} · {nights} nott{nights === 1 ? 'e' : 'i'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(253,248,240,0.7)', fontSize: '1.75rem', lineHeight: 1, padding: '0 0.25rem' }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>

          {/* Status badge */}
          <div style={{ marginBottom: '1.25rem' }}>
            {(() => {
              const s = STATUS_LABELS[booking.status] || STATUS_LABELS.pending
              return (
                <span style={{ display: 'inline-block', padding: '0.3rem 0.875rem', backgroundColor: s.bg, color: s.color, borderRadius: '9999px', fontSize: '0.82rem', fontWeight: 700 }}>
                  {s.label}
                </span>
              )
            })()}
          </div>

          {/* Detail grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <DetailItem label="Check-in" value={`${fmtLong(booking.check_in)}\ndalle ore 15:00`} />
            <DetailItem label="Check-out" value={`${fmtLong(booking.check_out)}\nentro le ore 11:00`} />
            <DetailItem label="Email" value={booking.guest_email} href={`mailto:${booking.guest_email}`} />
            <DetailItem label="Telefono" value={booking.guest_phone} href={`tel:${booking.guest_phone}`} />
            <DetailItem label="Totale" value={fmtPrice(booking.total_price)} accent />
            <DetailItem label="Notti" value={String(nights)} />
            {booking.notes && (
              <div style={{ gridColumn: 'span 2' }}>
                <DetailItem label="Note ospite" value={booking.notes} />
              </div>
            )}
          </div>

          {/* Message section */}
          <div style={{ backgroundColor: '#F5F4F0', borderRadius: '0.875rem', padding: '1.25rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9B9B8A', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
              Messaggio da inviare
            </p>

            {/* Toggle */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.875rem' }}>
              <button
                onClick={() => setMsgType('confirm')}
                style={{
                  flex: 1, padding: '0.45rem 0.5rem',
                  backgroundColor: msgType === 'confirm' ? '#dcfce7' : '#fff',
                  color: msgType === 'confirm' ? '#166534' : '#6B6B5A',
                  border: '1px solid', borderColor: msgType === 'confirm' ? '#bbf7d0' : '#e0dbd0',
                  borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                  transition: 'all 0.15s',
                }}
              >
                ✅ Conferma
              </button>
              <button
                onClick={() => setMsgType('cancel')}
                style={{
                  flex: 1, padding: '0.45rem 0.5rem',
                  backgroundColor: msgType === 'cancel' ? '#fef2ee' : '#fff',
                  color: msgType === 'cancel' ? '#C4603C' : '#6B6B5A',
                  border: '1px solid', borderColor: msgType === 'cancel' ? '#f0c0b0' : '#e0dbd0',
                  borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                  transition: 'all 0.15s',
                }}
              >
                ❌ Cancellazione
              </button>
            </div>

            {/* Editable message */}
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={11}
              style={{
                width: '100%', padding: '0.875rem',
                border: '1px solid #e0dbd0', borderRadius: '0.625rem',
                fontSize: '0.85rem', lineHeight: 1.65, resize: 'vertical',
                fontFamily: 'inherit', backgroundColor: '#fff', color: '#1A1A1A',
                boxSizing: 'border-box',
              }}
            />

            {/* Message actions */}
            <div style={{ display: 'flex', gap: '0.625rem', marginTop: '0.75rem' }}>
              <button
                onClick={copyMessage}
                style={{
                  flex: 1, padding: '0.65rem 0.5rem',
                  backgroundColor: copied ? '#dcfce7' : '#fff',
                  color: copied ? '#166534' : '#1A1A1A',
                  border: '1px solid', borderColor: copied ? '#bbf7d0' : '#e0dbd0',
                  borderRadius: '0.625rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                  transition: 'all 0.2s',
                }}
              >
                {copied ? '✓ Copiato!' : '📋 Copia'}
              </button>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1, padding: '0.65rem 0.5rem',
                  backgroundColor: '#25D366', color: '#fff',
                  borderRadius: '0.625rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700,
                  textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                }}
              >
                💬 WhatsApp
              </a>
              <button
                onClick={sendEmail}
                disabled={sending}
                style={{
                  flex: 1, padding: '0.65rem 0.5rem',
                  backgroundColor: sent ? '#dcfce7' : '#EFF6FF',
                  color: sent ? '#166534' : '#1d4ed8',
                  border: 'none',
                  borderRadius: '0.625rem', cursor: sending ? 'wait' : 'pointer', fontSize: '0.85rem', fontWeight: 700,
                  transition: 'all 0.2s',
                }}
              >
                {sent ? '✓ Inviata!' : sending ? '...' : '✉️ Invia'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div style={{
          padding: '1.25rem 1.5rem', borderTop: '1px solid #e8e4dc',
          backgroundColor: '#F5F4F0', display: 'flex', gap: '0.75rem', flexShrink: 0,
        }}>
          {booking.status !== 'confirmed' && booking.status !== 'cancelled' && (
            <button
              onClick={() => onUpdate(booking.id, 'confirmed')}
              disabled={updatingId === booking.id}
              style={{
                flex: 1, padding: '0.8rem',
                backgroundColor: '#166534', color: '#fff',
                border: 'none', borderRadius: '0.75rem',
                cursor: 'pointer', fontSize: '0.95rem', fontWeight: 700,
              }}
            >
              ✅ Conferma prenotazione
            </button>
          )}
          {booking.status === 'confirmed' && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#dcfce7', borderRadius: '0.75rem', padding: '0.8rem 1rem' }}>
              <span style={{ color: '#166534', fontWeight: 700, fontSize: '0.9rem' }}>✅ Prenotazione confermata</span>
            </div>
          )}
          {booking.status !== 'cancelled' && (
            <button
              onClick={() => { if (confirm(`Cancellare la prenotazione di ${booking.guest_name}?`)) onUpdate(booking.id, 'cancelled') }}
              disabled={updatingId === booking.id}
              style={{
                padding: '0.8rem 1.25rem',
                backgroundColor: '#fef2ee', color: '#C4603C',
                border: '1px solid #f0c0b0', borderRadius: '0.75rem',
                cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
              }}
            >
              Cancella
            </button>
          )}
        </div>
      </div>
    </>
  )
}

function DetailItem({
  label, value, href, accent,
}: {
  label: string
  value: string
  href?: string
  accent?: boolean
}) {
  return (
    <div>
      <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9B9B8A', fontWeight: 700, marginBottom: '0.3rem' }}>
        {label}
      </div>
      {href ? (
        <a href={href} style={{ fontSize: '0.9rem', color: '#2D4A3E', fontWeight: 600, textDecoration: 'none', wordBreak: 'break-all' }}>
          {value}
        </a>
      ) : (
        <div style={{
          fontSize: accent ? '1.15rem' : '0.9rem',
          color: accent ? '#C4603C' : '#1A1A1A',
          fontWeight: accent ? 700 : 500,
          whiteSpace: 'pre-line',
        }}>
          {value}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div style={{ backgroundColor: '#fff', borderRadius: '0.875rem', padding: '1.25rem 1.5rem', border: '1px solid #e8e4dc', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div className="font-mono-custom" style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1A1A1A', marginBottom: '0.25rem' }}>{value}</div>
      <div style={{ fontSize: '0.8rem', color: '#9B9B8A' }}>{label}</div>
    </div>
  )
}
