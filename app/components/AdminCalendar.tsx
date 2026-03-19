'use client'

import { useState } from 'react'
import { Booking } from '@/lib/types'

type Props = {
  bookings: Booking[]
}

const MONTHS_IT = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
]
const DAYS_IT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

const ROOM_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Camera dei Limoni':     { bg: '#fef9ec', text: '#92610a', border: '#f0d080' },
  'Camera dei Papaveri':   { bg: '#fef2ee', text: '#9B3010', border: '#f0b090' },
  'Suite delle Rose':      { bg: '#fdf0f5', text: '#831843', border: '#f0b8d0' },
  'Country House Completa':{ bg: '#f0faf5', text: '#065f46', border: '#a0d4bc' },
}

function toStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default function AdminCalendar({ bookings }: Props) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const todayStr = toStr(today.getFullYear(), today.getMonth(), today.getDate())

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDow = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7
  const cells = Math.ceil((firstDow + daysInMonth) / 7) * 7

  function getBookingsForDay(date: string) {
    return bookings.filter(b =>
      b.status !== 'cancelled' &&
      date >= b.check_in &&
      date < b.check_out
    )
  }

  const selectedBookings = selectedDay ? getBookingsForDay(selectedDay) : []

  const formatDateLong = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(p)

  return (
    <div>
      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <button onClick={prevMonth} style={navBtn}>‹</button>
        <h3 className="font-display" style={{ fontWeight: 700, fontSize: '1.4rem', color: '#1A1A1A' }}>
          {MONTHS_IT[viewMonth]} {viewYear}
        </h3>
        <button onClick={nextMonth} style={navBtn}>›</button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
        {DAYS_IT.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#9B9B8A', padding: '0.3rem 0' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {Array.from({ length: cells }).map((_, i) => {
          const day = i - firstDow + 1
          if (day < 1 || day > daysInMonth) {
            return <div key={i} style={{ minHeight: '72px', backgroundColor: '#f9f8f5', borderRadius: '0.5rem' }} />
          }
          const date = toStr(viewYear, viewMonth, day)
          const dayBookings = getBookingsForDay(date)
          const isToday = date === todayStr
          const isPast = date < todayStr
          const isSelected = date === selectedDay
          const hasBookings = dayBookings.length > 0

          return (
            <div
              key={i}
              onClick={() => setSelectedDay(date === selectedDay ? null : date)}
              style={{
                minHeight: '72px',
                padding: '0.4rem',
                backgroundColor: isSelected ? '#fef3ec' : isPast ? '#fafaf8' : '#fff',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                border: isSelected
                  ? '2px solid #C4603C'
                  : isToday
                    ? '2px solid #C8A050'
                    : '1px solid #f0ebe0',
                transition: 'all 0.1s',
              }}
            >
              <div style={{
                fontSize: '0.82rem',
                fontWeight: isToday ? 700 : hasBookings ? 600 : 400,
                color: isToday ? '#C4603C' : isPast ? '#C8C4BC' : '#1A1A1A',
                marginBottom: '0.3rem',
              }}>
                {day}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {dayBookings.slice(0, 2).map(b => {
                  const roomName = (b.rooms as any)?.name || '?'
                  const colors = ROOM_COLORS[roomName] || { bg: '#e5e7eb', text: '#374151', border: '#d1d5db' }
                  const isArrivo = b.check_in === date
                  const isPartenza = b.check_out === date
                  return (
                    <div key={b.id} style={{
                      backgroundColor: colors.bg,
                      color: colors.text,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '3px',
                      padding: '1px 4px',
                      fontSize: '0.62rem',
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {isArrivo ? '🏨 ' : isPartenza ? '👋 ' : ''}{b.guest_name.split(' ')[0]}
                    </div>
                  )
                })}
                {dayBookings.length > 2 && (
                  <div style={{ fontSize: '0.6rem', color: '#9B9B8A', paddingLeft: '2px' }}>
                    +{dayBookings.length - 2}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected day detail panel */}
      {selectedDay && (
        <div style={{
          marginTop: '1.5rem',
          backgroundColor: '#fff',
          borderRadius: '1rem',
          padding: '1.5rem',
          border: '1px solid #f0ebe0',
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 className="font-display" style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1A1A1A', textTransform: 'capitalize' }}>
              {formatDateLong(selectedDay)}
            </h4>
            <button
              onClick={() => setSelectedDay(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9B9B8A', fontSize: '1.1rem' }}
            >
              ✕
            </button>
          </div>

          {selectedBookings.length === 0 ? (
            <p style={{ color: '#9B9B8A', fontSize: '0.9rem' }}>Nessuna prenotazione questo giorno.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {selectedBookings.map(b => {
                const roomName = (b.rooms as any)?.name || '?'
                const colors = ROOM_COLORS[roomName] || { bg: '#e5e7eb', text: '#374151', border: '#d1d5db' }
                const isArrivo = b.check_in === selectedDay
                const isPartenza = b.check_out === selectedDay
                const nights = Math.round(
                  (new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / 86400000
                )
                return (
                  <div key={b.id} style={{
                    display: 'flex', gap: '1rem', alignItems: 'flex-start',
                    padding: '1rem', borderRadius: '0.75rem',
                    backgroundColor: colors.bg,
                    border: `1px solid ${colors.border}`,
                  }}>
                    <div style={{ fontSize: '1.5rem' }}>
                      {isArrivo ? '🏨' : isPartenza ? '👋' : '🛏️'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: colors.text, fontSize: '0.95rem' }}>
                        {b.guest_name}
                        {isArrivo && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#2D4A3E' }}>ARRIVO</span>}
                        {isPartenza && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#C4603C' }}>PARTENZA</span>}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#6B6B5A', marginTop: '0.2rem' }}>{roomName}</div>
                      <div style={{ fontSize: '0.8rem', color: '#9B9B8A', marginTop: '0.2rem' }}>
                        {b.check_in} → {b.check_out} · {nights} {nights === 1 ? 'notte' : 'notti'}
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                        <a href={`tel:${b.guest_phone}`} style={{ fontSize: '0.8rem', color: colors.text, textDecoration: 'none', fontWeight: 600 }}>
                          📞 {b.guest_phone}
                        </a>
                        <a href={`mailto:${b.guest_email}`} style={{ fontSize: '0.8rem', color: colors.text, textDecoration: 'none' }}>
                          ✉️ {b.guest_email}
                        </a>
                      </div>
                      {b.notes && (
                        <div style={{ fontSize: '0.78rem', color: '#6B6B5A', marginTop: '0.3rem', fontStyle: 'italic' }}>
                          Note: {b.notes}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div className="font-mono-custom" style={{ fontWeight: 700, color: colors.text, fontSize: '1rem' }}>
                        {formatPrice(b.total_price)}
                      </div>
                      <div style={{
                        marginTop: '0.3rem', fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.5rem',
                        borderRadius: '9999px',
                        backgroundColor: b.status === 'confirmed' ? '#dcfce7' : '#fef3c7',
                        color: b.status === 'confirmed' ? '#166534' : '#92610a',
                      }}>
                        {b.status === 'confirmed' ? 'Confermata' : 'In attesa'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Room legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f0ebe0' }}>
        {Object.entries(ROOM_COLORS).map(([room, colors]) => (
          <div key={room} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: colors.bg, border: `1px solid ${colors.border}` }} />
            <span style={{ fontSize: '0.75rem', color: '#6B6B5A' }}>{room}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', border: '2px solid #C8A050', backgroundColor: '#fff' }} />
          <span style={{ fontSize: '0.75rem', color: '#6B6B5A' }}>Oggi</span>
        </div>
      </div>
    </div>
  )
}

const navBtn: React.CSSProperties = {
  background: 'none', border: '1px solid #e8e4dc', borderRadius: '0.5rem',
  padding: '0.35rem 0.9rem', cursor: 'pointer', fontSize: '1.3rem', color: '#6B6B5A', lineHeight: 1,
}
