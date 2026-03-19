'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Booking } from '@/lib/types'

type FilterTab = 'tutte' | 'arrivo' | 'passate' | 'cancellate'

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'In attesa', color: '#92610a', bg: '#fef3c7' },
  confirmed: { label: 'Confermata', color: '#166534', bg: '#dcfce7' },
  cancelled: { label: 'Cancellata', color: '#6B6B5A', bg: '#f1f0ec' },
}

export default function AdminPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<FilterTab>('tutte')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadBookings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/bookings')
      if (res.status === 401) {
        router.push('/admin/login')
        return
      }
      const data = await res.json()
      setBookings(Array.isArray(data) ? data : [])
    } catch {
      setBookings([])
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadBookings()
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

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'tutte') return b.status !== 'cancelled'
    if (activeTab === 'cancellate') return b.status === 'cancelled'
    if (activeTab === 'arrivo') return b.check_in >= today && b.status !== 'cancelled'
    if (activeTab === 'passate') return b.check_out < today && b.status !== 'cancelled'
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

  const formatDate = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' })

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(p)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F4F0' }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#2D4A3E', padding: '1rem 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/" className="font-display" style={{ color: '#FDF8F0', textDecoration: 'none', fontSize: '1.4rem', fontWeight: 700 }}>
            Le Limonaie
          </Link>
          <span style={{ color: 'rgba(253,248,240,0.5)', fontSize: '0.9rem' }}>/ Admin</span>
        </div>
        <button
          onClick={handleLogout}
          style={{ background: 'none', border: '1px solid rgba(253,248,240,0.3)', color: 'rgba(253,248,240,0.7)', padding: '0.4rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          Esci
        </button>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <StatCard label="Totale prenotazioni" value={String(stats.total)} icon="📋" />
          <StatCard label="Questo mese" value={String(stats.thisMonth)} icon="📅" />
          <StatCard
            label="Prossimo check-in"
            value={stats.nextCheckIn ? formatDate(stats.nextCheckIn) : '—'}
            icon="🏨"
          />
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {[
            { key: 'tutte', label: 'Tutte' },
            { key: 'arrivo', label: 'In arrivo' },
            { key: 'passate', label: 'Passate' },
            { key: 'cancellate', label: 'Cancellate' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as FilterTab)}
              style={{
                padding: '0.5rem 1.25rem',
                backgroundColor: activeTab === tab.key ? '#C4603C' : '#fff',
                color: activeTab === tab.key ? '#fff' : '#6B6B5A',
                border: `1px solid ${activeTab === tab.key ? '#C4603C' : '#e0dbd0'}`,
                borderRadius: '9999px', cursor: 'pointer', fontWeight: activeTab === tab.key ? 600 : 400,
                fontSize: '0.9rem', transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}

          <button
            onClick={loadBookings}
            style={{
              marginLeft: 'auto', padding: '0.5rem 1rem',
              backgroundColor: 'transparent', border: '1px solid #e0dbd0',
              borderRadius: '9999px', cursor: 'pointer', color: '#6B6B5A', fontSize: '0.85rem',
            }}
          >
            ↻ Aggiorna
          </button>
        </div>

        {/* Table */}
        <div style={{
          backgroundColor: '#fff', borderRadius: '1rem',
          border: '1px solid #e8e4dc',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          overflowX: 'auto',
        }}>
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#9B9B8A' }}>
              Caricamento prenotazioni...
            </div>
          ) : filteredBookings.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#9B9B8A' }}>
              Nessuna prenotazione trovata.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F5F4F0', borderBottom: '1px solid #e8e4dc' }}>
                  {['Arrivo', 'Partenza', 'Camera', 'Ospite', 'Telefono', 'Note', 'Totale', 'Stato', 'Azioni'].map(col => (
                    <th key={col} style={{
                      padding: '0.875rem 1rem', textAlign: 'left',
                      fontSize: '0.75rem', fontWeight: 700, color: '#9B9B8A',
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                    }}>
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

                  return (
                    <tr
                      key={booking.id}
                      style={{
                        borderBottom: idx < filteredBookings.length - 1 ? '1px solid #f0ece4' : 'none',
                        opacity: isCancelled ? 0.5 : 1,
                        backgroundColor: isPast && !isCancelled ? '#fafaf8' : '#fff',
                        textDecoration: isCancelled ? 'line-through' : 'none',
                      }}
                    >
                      <td style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap' }}>
                        <span className="font-mono-custom" style={{ fontSize: '0.85rem', color: '#1A1A1A' }}>
                          {formatDate(booking.check_in)}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap' }}>
                        <span className="font-mono-custom" style={{ fontSize: '0.85rem', color: '#1A1A1A' }}>
                          {formatDate(booking.check_out)}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{ fontSize: '0.85rem', color: '#1A1A1A', fontWeight: 500 }}>{roomName}</span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1A1A1A' }}>{booking.guest_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#9B9B8A' }}>{booking.guest_email}</div>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap' }}>
                        <a href={`tel:${booking.guest_phone}`} style={{ fontSize: '0.85rem', color: '#2D4A3E', textDecoration: 'none' }}>
                          {booking.guest_phone}
                        </a>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', maxWidth: '150px' }}>
                        <span style={{ fontSize: '0.8rem', color: '#6B6B5A', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {booking.notes || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap' }}>
                        <span className="font-mono-custom" style={{ fontSize: '0.9rem', fontWeight: 600, color: '#C4603C' }}>
                          {formatPrice(booking.total_price)}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.625rem',
                          backgroundColor: statusInfo.bg,
                          color: statusInfo.color,
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {booking.status !== 'confirmed' && booking.status !== 'cancelled' && (
                            <button
                              onClick={() => updateStatus(booking.id, 'confirmed')}
                              disabled={updatingId === booking.id}
                              style={{
                                padding: '0.35rem 0.75rem',
                                backgroundColor: '#dcfce7', color: '#166534',
                                border: '1px solid #bbf7d0', borderRadius: '0.5rem',
                                cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                              }}
                            >
                              Conferma
                            </button>
                          )}
                          {booking.status !== 'cancelled' && (
                            <button
                              onClick={() => {
                                if (confirm(`Cancellare la prenotazione di ${booking.guest_name}?`)) {
                                  updateStatus(booking.id, 'cancelled')
                                }
                              }}
                              disabled={updatingId === booking.id}
                              style={{
                                padding: '0.35rem 0.75rem',
                                backgroundColor: '#fef2ee', color: '#C4603C',
                                border: '1px solid #f0c0b0', borderRadius: '0.5rem',
                                cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                              }}
                            >
                              Cancella
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <p style={{ textAlign: 'center', color: '#9B9B8A', fontSize: '0.8rem', marginTop: '2rem' }}>
          {filteredBookings.length} prenotazion{filteredBookings.length === 1 ? 'e' : 'i'} mostrat{filteredBookings.length === 1 ? 'a' : 'e'}
        </p>
      </main>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div style={{
      backgroundColor: '#fff', borderRadius: '0.875rem', padding: '1.25rem 1.5rem',
      border: '1px solid #e8e4dc', boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
    }}>
      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div className="font-mono-custom" style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1A1A1A', marginBottom: '0.25rem' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.8rem', color: '#9B9B8A' }}>{label}</div>
    </div>
  )
}
