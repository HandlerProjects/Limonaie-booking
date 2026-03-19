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

const ROOM_DOTS: Record<string, string> = {
  limoni:    '#D4A017',
  papaveri:  '#C4603C',
  rose:      '#E8829A',
  country:   '#4A7C59',
}

function getRoomDotColor(name: string): string {
  const key = name.toLowerCase().replace(/\s+/g, '')
  for (const k of Object.keys(ROOM_DOTS)) {
    if (key.includes(k)) return ROOM_DOTS[k]
  }
  return '#9B9B8A'
}

const ITALIAN_MONTHS_SHORT = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function getAvatarColor(name: string): string {
  const colors = ['#C4603C', '#2D4A3E', '#4A7C59', '#92610a', '#6B4E71', '#1e5f8a', '#8a3a1e']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i)
  return colors[hash % colors.length]
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
  const [search, setSearch] = useState('')

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

  // Stats
  const now = new Date()
  const activeCount = bookings.filter(b => b.status !== 'cancelled').length
  const confirmedRevenue = bookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + b.total_price, 0)
  const monthRevenue = bookings
    .filter(b => {
      if (b.status !== 'confirmed') return false
      const d = new Date(b.check_in + 'T00:00:00')
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    .reduce((sum, b) => sum + b.total_price, 0)

  // Revenue bar chart — last 6 months (confirmed bookings grouped by check_in month)
  const revenueByMonth: { label: string; value: number; isCurrent: boolean }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const m = d.getMonth()
    const y = d.getFullYear()
    const value = bookings
      .filter(b => {
        if (b.status !== 'confirmed') return false
        const bd = new Date(b.check_in + 'T00:00:00')
        return bd.getMonth() === m && bd.getFullYear() === y
      })
      .reduce((sum, b) => sum + b.total_price, 0)
    revenueByMonth.push({
      label: ITALIAN_MONTHS_SHORT[m],
      value,
      isCurrent: i === 0,
    })
  }
  const maxVal = Math.max(...revenueByMonth.map(r => r.value), 1)

  // Most booked room
  const roomCounts: Record<string, number> = {}
  bookings.forEach(b => {
    if (b.status === 'cancelled') return
    const name = (b.rooms as any)?.name || 'Sconosciuta'
    roomCounts[name] = (roomCounts[name] || 0) + 1
  })
  const mostBooked = Object.entries(roomCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'

  // Average nights (non-cancelled)
  const nightsList = bookings
    .filter(b => b.status !== 'cancelled')
    .map(b => Math.round((new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / 86400000))
  const avgNights = nightsList.length > 0
    ? (nightsList.reduce((a, n) => a + n, 0) / nightsList.length).toFixed(1)
    : '—'

  const fmtPrice = (p: number) =>
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(p)

  const fmt = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' })

  // Filter by tab, then by search
  const tabFilteredBookings = bookings.filter(b => {
    if (activeFilter === 'tutte') return b.status !== 'cancelled'
    if (activeFilter === 'cancellate') return b.status === 'cancelled'
    if (activeFilter === 'arrivo') return b.check_in >= today && b.status !== 'cancelled'
    if (activeFilter === 'passate') return b.check_out < today && b.status !== 'cancelled'
    return true
  })

  const searchLower = search.toLowerCase().trim()
  const filteredBookings = searchLower
    ? tabFilteredBookings.filter(b => {
        const roomName = ((b.rooms as any)?.name || '').toLowerCase()
        return (
          b.guest_name.toLowerCase().includes(searchLower) ||
          b.guest_email.toLowerCase().includes(searchLower) ||
          b.guest_phone.toLowerCase().includes(searchLower) ||
          roomName.includes(searchLower)
        )
      })
    : tabFilteredBookings

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

        {/* Stats — 2x2 on mobile, 4 columns on desktop */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          <StatCard
            label="Prenotazioni attive"
            value={String(activeCount)}
            icon="📋"
          />
          <StatCard
            label="In attesa"
            value={String(pendingCount)}
            icon="⏳"
            highlight={pendingCount > 0 ? 'amber' : undefined}
          />
          <StatCard
            label="Ricavi confermati"
            value={fmtPrice(confirmedRevenue)}
            icon="💶"
            small
          />
          <StatCard
            label="Ricavi questo mese"
            value={fmtPrice(monthRevenue)}
            icon="📅"
            small
          />
        </div>

        {/* Revenue bar chart */}
        <div style={{ backgroundColor: '#fff', borderRadius: '1rem', border: '1px solid #e8e4dc', padding: '1.5rem', marginBottom: '1.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          {/* Chart header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1A1A1A', marginBottom: '0.25rem' }}>
                Ricavi ultimi 6 mesi
              </div>
              <div style={{ fontSize: '0.78rem', color: '#9B9B8A' }}>Solo prenotazioni confermate</div>
            </div>
            <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#F5F4F0', borderRadius: '9999px', padding: '0.3rem 0.75rem', fontSize: '0.78rem', color: '#6B6B5A', fontWeight: 600 }}>
                🏠 {mostBooked}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#F5F4F0', borderRadius: '9999px', padding: '0.3rem 0.75rem', fontSize: '0.78rem', color: '#6B6B5A', fontWeight: 600 }}>
                🌙 {avgNights} notti medie
              </span>
            </div>
          </div>

          {/* Bars */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '90px' }}>
            {revenueByMonth.map((month, i) => {
              const barH = Math.max(2, Math.round((month.value / maxVal) * 70))
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '90px', gap: '4px' }}>
                  {/* Value label above bar */}
                  <div style={{ fontSize: '0.65rem', color: month.isCurrent ? '#C4603C' : '#9B9B8A', fontWeight: 600, minHeight: '14px', textAlign: 'center' }}>
                    {month.value > 0 ? fmtPrice(month.value).replace('€\u00a0', '€').replace(',00', '') : ''}
                  </div>
                  {/* Bar */}
                  <div style={{
                    width: '100%',
                    height: `${barH}px`,
                    backgroundColor: month.isCurrent ? '#C4603C' : '#e8e4dc',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease',
                  }} />
                  {/* Month label below */}
                  <div style={{ fontSize: '0.72rem', color: month.isCurrent ? '#C4603C' : '#9B9B8A', fontWeight: month.isCurrent ? 700 : 400, marginTop: '2px' }}>
                    {month.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* View toggle */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
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
            onClick={() => loadBookings()}
            style={{ marginLeft: 'auto', padding: '0.5rem 1rem', backgroundColor: 'transparent', border: '1px solid #e0dbd0', borderRadius: '9999px', cursor: 'pointer', color: '#6B6B5A', fontSize: '0.85rem' }}
          >
            ↻ Aggiorna
          </button>
        </div>

        {/* Search bar — only in lista view */}
        {activeView === 'lista' && (
          <div style={{ marginBottom: '1rem', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', color: '#9B9B8A', pointerEvents: 'none' }}>
              🔍
            </span>
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cerca per ospite, email, telefono, camera..."
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.75rem',
                backgroundColor: '#fff',
                border: '1px solid #e8e4dc',
                borderRadius: '0.75rem',
                fontSize: '0.9rem',
                color: '#1A1A1A',
                outline: 'none',
                boxSizing: 'border-box',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#C4603C' }}
              onBlur={e => { e.currentTarget.style.borderColor = '#e8e4dc' }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9B9B8A', fontSize: '1.1rem', lineHeight: 1, padding: '0.25rem' }}
                title="Cancella ricerca"
              >
                ×
              </button>
            )}
          </div>
        )}

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
              <div style={{ padding: '4rem', textAlign: 'center', color: '#9B9B8A' }}>
                {search ? `Nessun risultato per "${search}".` : 'Nessuna prenotazione trovata.'}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '860px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F5F4F0', borderBottom: '1px solid #e8e4dc' }}>
                    {['Ospite', 'Camera', 'Date', 'Notti', 'Totale', 'Stato', 'Azioni'].map(col => (
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
                    const nights = Math.round(
                      (new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / 86400000
                    )
                    const dotColor = getRoomDotColor(roomName)
                    const initials = getInitials(booking.guest_name)
                    const avatarColor = getAvatarColor(booking.guest_name)

                    return (
                      <tr
                        key={booking.id}
                        onClick={() => setSelectedBooking(booking)}
                        style={{
                          borderBottom: idx < filteredBookings.length - 1 ? '1px solid #f0ece4' : 'none',
                          opacity: isCancelled ? 0.55 : 1,
                          backgroundColor: isSelected ? '#fef3e8' : isToday ? '#fef8f0' : isPast && !isCancelled ? '#fafaf8' : '#fff',
                          textDecoration: isCancelled ? 'line-through' : 'none',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s',
                        }}
                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = '#f9f6f0' }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = isToday ? '#fef8f0' : isPast && !isCancelled ? '#fafaf8' : '#fff' }}
                      >
                        {/* Ospite — avatar + name + email */}
                        <td style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                            <div style={{
                              width: '36px', height: '36px', borderRadius: '50%',
                              backgroundColor: avatarColor, color: '#fff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.75rem', fontWeight: 700, flexShrink: 0, letterSpacing: '0.02em',
                            }}>
                              {initials}
                            </div>
                            <div>
                              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1A1A1A' }}>{booking.guest_name}</div>
                              <div style={{ fontSize: '0.73rem', color: '#9B9B8A', marginTop: '1px' }}>{booking.guest_email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Camera — colored dot + name */}
                        <td style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: dotColor, flexShrink: 0, display: 'inline-block' }} />
                            <span style={{ fontSize: '0.85rem', color: '#1A1A1A', fontWeight: 500 }}>{roomName}</span>
                          </div>
                        </td>

                        {/* Date */}
                        <td style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap' }}>
                          <div style={{ fontSize: '0.82rem', color: isToday ? '#C4603C' : '#1A1A1A', fontWeight: isToday ? 700 : 400 }}>
                            {fmt(booking.check_in)}{isToday && <span style={{ marginLeft: '0.35rem', fontSize: '0.65rem', backgroundColor: '#C4603C', color: '#fff', borderRadius: '3px', padding: '1px 4px', fontWeight: 700 }}>OGGI</span>}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#9B9B8A', marginTop: '1px' }}>→ {fmt(booking.check_out)}</div>
                        </td>

                        {/* Notti badge */}
                        <td style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', backgroundColor: '#F5F4F0', color: '#6B6B5A', borderRadius: '9999px', padding: '0.2rem 0.625rem', fontSize: '0.78rem', fontWeight: 600 }}>
                            🌙 {nights}
                          </span>
                        </td>

                        {/* Totale */}
                        <td style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#C4603C' }}>
                            {fmtPrice(booking.total_price)}
                          </span>
                        </td>

                        {/* Stato */}
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <span style={{ display: 'inline-block', padding: '0.25rem 0.625rem', backgroundColor: statusInfo.bg, color: statusInfo.color, borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {statusInfo.label}
                          </span>
                        </td>

                        {/* Azioni */}
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
          {activeView === 'lista' && `${filteredBookings.length} prenotazion${filteredBookings.length === 1 ? 'e' : 'i'} mostrat${filteredBookings.length === 1 ? 'a' : 'e'}${search ? ` per "${search}"` : ''} · Clicca su una riga per i dettagli`}
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

  const buildMsg = (type: 'confirm' | 'cancel') =>
    type === 'confirm'
      ? `Ciao ${booking.guest_name}! 👋\n\nSiamo lieti di confermare la tua prenotazione presso Le Limonaie 🍋\n\n📍 Camera: ${roomName}\n📅 Check-in: ${fmtLong(booking.check_in)} dalle ore 15:00\n📅 Check-out: ${fmtLong(booking.check_out)} entro le ore 11:00\n🌙 Durata: ${nights} nott${nights === 1 ? 'e' : 'i'}\n💶 Totale: ${fmtPrice(booking.total_price)}\n\nTi aspettiamo! Per qualsiasi info:\n📞 +39 339 59 66 527\n\n— Lo staff di Le Limonaie`
      : `Ciao ${booking.guest_name},\n\nSiamo spiacenti di comunicarti che la prenotazione per ${roomName} dal ${fmtLong(booking.check_in)} al ${fmtLong(booking.check_out)} non è purtroppo disponibile.\n\nContattaci per trovare un'alternativa:\n📞 +39 339 59 66 527\n\n— Lo staff di Le Limonaie`

  type Tab = 'dettagli' | 'comunicazione' | 'note'
  const [tab, setTab] = useState<Tab>('dettagli')
  const [msgType, setMsgType] = useState<'confirm' | 'cancel'>('confirm')
  const [message, setMessage] = useState(() => buildMsg('confirm'))
  const [copied, setCopied] = useState(false)
  const [adminNotes, setAdminNotes] = useState((booking as any).admin_notes || '')
  const [notesSaved, setNotesSaved] = useState(false)
  const [actionDone, setActionDone] = useState<'confirmed' | 'cancelled' | null>(null)

  useEffect(() => {
    setMessage(buildMsg(msgType))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msgType])

  const phoneClean = booking.guest_phone.replace(/\D/g, '')
  const waLink = `https://wa.me/${phoneClean}?text=${encodeURIComponent(message)}`

  const copyMsg = async () => {
    await navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const saveNotes = async () => {
    await fetch(`/api/bookings/${booking.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_notes: adminNotes }),
    })
    setNotesSaved(true)
    setTimeout(() => setNotesSaved(false), 2500)
  }

  const handleAction = (action: 'confirmed' | 'cancelled') => {
    if (action === 'cancelled' && !confirm(`Cancellare la prenotazione di ${booking.guest_name}?`)) return
    onUpdate(booking.id, action)
    setActionDone(action)
    setMsgType(action === 'confirmed' ? 'confirm' : 'cancel')
    setMessage(buildMsg(action === 'confirmed' ? 'confirm' : 'cancel'))
    setTab('comunicazione')
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'dettagli', label: '📋 Dettagli' },
    { key: 'comunicazione', label: '💬 Comunica' },
    { key: 'note', label: '📝 Note' },
  ]

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', zIndex: 40, backdropFilter: 'blur(2px)' }} />

      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: '100%', maxWidth: '500px',
        backgroundColor: '#fff', zIndex: 50,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 32px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', backgroundColor: '#2D4A3E', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#FDF8F0' }}>{booking.guest_name}</div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(253,248,240,0.65)', marginTop: '0.15rem' }}>
              {roomName} · {nights} nott{nights === 1 ? 'e' : 'i'} ·{' '}
              {(() => {
                const s = STATUS_LABELS[booking.status] || STATUS_LABELS.pending
                return <span style={{ color: s.color === '#166534' ? '#86efac' : s.color === '#92610a' ? '#fde68a' : 'rgba(253,248,240,0.5)' }}>{s.label}</span>
              })()}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(253,248,240,0.7)', fontSize: '1.75rem', lineHeight: 1 }}>×</button>
        </div>

        {/* Post-action banner */}
        {actionDone && (
          <div style={{
            padding: '0.875rem 1.5rem', flexShrink: 0,
            backgroundColor: actionDone === 'confirmed' ? '#dcfce7' : '#fef2ee',
            borderBottom: '1px solid', borderColor: actionDone === 'confirmed' ? '#bbf7d0' : '#f0c0b0',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <span style={{ fontSize: '1rem' }}>{actionDone === 'confirmed' ? '✅' : '❌'}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: actionDone === 'confirmed' ? '#166534' : '#C4603C' }}>
                {actionDone === 'confirmed' ? 'Prenotazione confermata!' : 'Prenotazione rifiutata'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#6B6B5A' }}>
                Ora invia il messaggio WhatsApp all&apos;ospite →
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e8e4dc', backgroundColor: '#F5F4F0', flexShrink: 0 }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: '0.75rem 0.5rem',
                background: 'none', border: 'none',
                borderBottom: tab === t.key ? '2px solid #C4603C' : '2px solid transparent',
                color: tab === t.key ? '#C4603C' : '#6B6B5A',
                fontWeight: tab === t.key ? 700 : 400,
                fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>

          {/* TAB: DETTAGLI */}
          {tab === 'dettagli' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <DetailItem label="Check-in" value={`${fmtLong(booking.check_in)}\ndalle ore 15:00`} />
                <DetailItem label="Check-out" value={`${fmtLong(booking.check_out)}\nentro le ore 11:00`} />
                <DetailItem label="Telefono" value={booking.guest_phone} href={`tel:${booking.guest_phone}`} />
                <DetailItem label="Email" value={booking.guest_email} href={`mailto:${booking.guest_email}`} />
                <DetailItem label="Totale" value={fmtPrice(booking.total_price)} accent />
                <DetailItem label="Notti" value={`${nights} nott${nights === 1 ? 'e' : 'i'}`} />
                {booking.notes && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <DetailItem label="Note dell'ospite" value={booking.notes} />
                  </div>
                )}
              </div>

              {/* Quick contact */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <a
                  href={`tel:${booking.guest_phone}`}
                  style={{ flex: 1, padding: '0.75rem', backgroundColor: '#f0f7f4', color: '#2D4A3E', borderRadius: '0.75rem', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem', textAlign: 'center' }}
                >
                  📞 Chiama
                </a>
                <a
                  href={`https://wa.me/${phoneClean}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ flex: 1, padding: '0.75rem', backgroundColor: '#25D366', color: '#fff', borderRadius: '0.75rem', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem', textAlign: 'center' }}
                >
                  💬 WhatsApp
                </a>
              </div>
            </div>
          )}

          {/* TAB: COMUNICAZIONE */}
          {tab === 'comunicazione' && (
            <div>
              {actionDone && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#92610a' }}>
                  💡 Messaggio pre-compilato con la risposta. Modifica se necessario, poi invia su WhatsApp.
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.875rem' }}>
                <button
                  onClick={() => setMsgType('confirm')}
                  style={{
                    flex: 1, padding: '0.45rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                    backgroundColor: msgType === 'confirm' ? '#dcfce7' : '#fff',
                    color: msgType === 'confirm' ? '#166534' : '#6B6B5A',
                    border: '1px solid', borderColor: msgType === 'confirm' ? '#bbf7d0' : '#e0dbd0',
                    borderRadius: '0.5rem', transition: 'all 0.15s',
                  }}
                >✅ Conferma</button>
                <button
                  onClick={() => setMsgType('cancel')}
                  style={{
                    flex: 1, padding: '0.45rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                    backgroundColor: msgType === 'cancel' ? '#fef2ee' : '#fff',
                    color: msgType === 'cancel' ? '#C4603C' : '#6B6B5A',
                    border: '1px solid', borderColor: msgType === 'cancel' ? '#f0c0b0' : '#e0dbd0',
                    borderRadius: '0.5rem', transition: 'all 0.15s',
                  }}
                >❌ Rifiuto</button>
              </div>

              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={11}
                style={{
                  width: '100%', padding: '0.875rem', marginBottom: '0.75rem',
                  border: '1px solid #e0dbd0', borderRadius: '0.625rem',
                  fontSize: '0.85rem', lineHeight: 1.65, resize: 'vertical',
                  fontFamily: 'inherit', backgroundColor: '#fff', color: '#1A1A1A',
                  boxSizing: 'border-box',
                }}
              />

              <div style={{ display: 'flex', gap: '0.625rem' }}>
                <button
                  onClick={copyMsg}
                  style={{
                    flex: 1, padding: '0.75rem',
                    backgroundColor: copied ? '#dcfce7' : '#F5F4F0',
                    color: copied ? '#166534' : '#1A1A1A',
                    border: '1px solid #e0dbd0', borderRadius: '0.75rem',
                    cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, transition: 'all 0.2s',
                  }}
                >
                  {copied ? '✓ Copiato!' : '📋 Copia testo'}
                </button>
                <a
                  href={waLink}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    flex: 2, padding: '0.75rem',
                    backgroundColor: actionDone ? '#128C7E' : '#25D366', color: '#fff',
                    borderRadius: '0.75rem', textDecoration: 'none',
                    fontWeight: 700, fontSize: '0.95rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                    boxShadow: actionDone ? '0 0 0 3px rgba(37,211,102,0.35)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  💬 Invia su WhatsApp
                </a>
              </div>
            </div>
          )}

          {/* TAB: NOTE INTERNE */}
          {tab === 'note' && (
            <div>
              <p style={{ fontSize: '0.82rem', color: '#9B9B8A', margin: '0 0 0.875rem' }}>
                Note visibili solo a te — log chiamate, WhatsApp inviati, accordi presi, ecc.
              </p>
              <textarea
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                rows={14}
                placeholder={`Es:\n• 12/06 — WhatsApp di conferma inviato\n• 13/06 — Cliente chiede check-in anticipato, ok dalle 13\n• Pagamento: bonifico ricevuto`}
                style={{
                  width: '100%', padding: '0.875rem', marginBottom: '0.75rem',
                  border: '1px solid #e0dbd0', borderRadius: '0.625rem',
                  fontSize: '0.85rem', lineHeight: 1.7, resize: 'vertical',
                  fontFamily: 'inherit', backgroundColor: '#fff', color: '#1A1A1A',
                  boxSizing: 'border-box',
                }}
              />
              <button
                onClick={saveNotes}
                style={{
                  width: '100%', padding: '0.8rem',
                  backgroundColor: notesSaved ? '#dcfce7' : '#2D4A3E',
                  color: notesSaved ? '#166534' : '#fff',
                  border: 'none', borderRadius: '0.75rem',
                  cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem',
                  transition: 'all 0.2s',
                }}
              >
                {notesSaved ? '✓ Salvato!' : 'Salva note'}
              </button>
            </div>
          )}
        </div>

        {/* Footer — only show action buttons in dettagli tab or when pending */}
        {booking.status === 'pending' && tab === 'dettagli' && (
          <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #e8e4dc', backgroundColor: '#F5F4F0', display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
            <button
              onClick={() => handleAction('confirmed')}
              disabled={updatingId === booking.id}
              style={{ flex: 1, padding: '0.8rem', backgroundColor: '#166534', color: '#fff', border: 'none', borderRadius: '0.75rem', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 700 }}
            >
              ✅ Conferma
            </button>
            <button
              onClick={() => handleAction('cancelled')}
              disabled={updatingId === booking.id}
              style={{ padding: '0.8rem 1.25rem', backgroundColor: '#fef2ee', color: '#C4603C', border: '1px solid #f0c0b0', borderRadius: '0.75rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
            >
              Rifiuta
            </button>
          </div>
        )}
        {booking.status === 'confirmed' && tab === 'dettagli' && (
          <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #e8e4dc', backgroundColor: '#F5F4F0', display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
            <div style={{ flex: 1, backgroundColor: '#dcfce7', borderRadius: '0.75rem', padding: '0.8rem 1rem', display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#166534', fontWeight: 700, fontSize: '0.9rem' }}>✅ Confermata</span>
            </div>
            <button
              onClick={() => handleAction('cancelled')}
              disabled={updatingId === booking.id}
              style={{ padding: '0.8rem 1.25rem', backgroundColor: '#fef2ee', color: '#C4603C', border: '1px solid #f0c0b0', borderRadius: '0.75rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
            >
              Cancella
            </button>
          </div>
        )}
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

function StatCard({
  label, value, icon, highlight, small,
}: {
  label: string
  value: string
  icon: string
  highlight?: 'amber'
  small?: boolean
}) {
  const isAmber = highlight === 'amber'
  return (
    <div style={{
      backgroundColor: isAmber ? '#fffbeb' : '#fff',
      borderRadius: '0.875rem',
      padding: '1.25rem 1.5rem',
      border: `1px solid ${isAmber ? '#fde68a' : '#e8e4dc'}`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
    }}>
      <div style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div className="font-mono-custom" style={{
        fontSize: small ? '1.25rem' : '1.75rem',
        fontWeight: 700,
        color: isAmber ? '#92610a' : '#1A1A1A',
        marginBottom: '0.25rem',
        lineHeight: 1.2,
      }}>
        {value}
      </div>
      <div style={{ fontSize: '0.78rem', color: isAmber ? '#92610a' : '#9B9B8A', fontWeight: isAmber ? 600 : 400 }}>{label}</div>
    </div>
  )
}
