'use client'

import { useState, useEffect } from 'react'

type BookedRange = { check_in: string; check_out: string }

type Props = {
  roomId: string | null
  checkIn: string
  checkOut: string
  onChange: (checkIn: string, checkOut: string) => void
}

const MONTHS_IT = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
]
const DAYS_IT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

function toStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function todayStr() {
  const t = new Date()
  return toStr(t.getFullYear(), t.getMonth(), t.getDate())
}

export default function BookingCalendar({ roomId, checkIn, checkOut, onChange }: Props) {
  const today = todayStr()
  const [viewYear, setViewYear] = useState(new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(new Date().getMonth())
  const [bookedRanges, setBookedRanges] = useState<BookedRange[]>([])
  const [hoverDate, setHoverDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!roomId) { setBookedRanges([]); return }
    setLoading(true)
    fetch(`/api/bookings/dates?room_id=${roomId}`)
      .then(r => r.json())
      .then(d => setBookedRanges(d.ranges || []))
      .catch(() => setBookedRanges([]))
      .finally(() => setLoading(false))
  }, [roomId])

  function isBooked(date: string) {
    return bookedRanges.some(r => date >= r.check_in && date < r.check_out)
  }

  function hasConflict(start: string, end: string) {
    return bookedRanges.some(r => r.check_in < end && r.check_out > start)
  }

  function handleClick(date: string) {
    if (date < today || isBooked(date)) return
    if (!checkIn || (checkIn && checkOut)) {
      onChange(date, '')
    } else {
      if (date <= checkIn) {
        onChange(date, '')
      } else if (!hasConflict(checkIn, date)) {
        onChange(checkIn, date)
      }
    }
  }

  // Effective hover end (only if no conflict in range)
  const effectiveHover =
    checkIn && !checkOut && hoverDate && hoverDate > checkIn && !hasConflict(checkIn, hoverDate)
      ? hoverDate
      : null

  function getDayStyle(date: string): React.CSSProperties {
    const isPast = date < today
    const booked = isBooked(date)
    const isCI = date === checkIn
    const isCO = date === checkOut
    const inRange = checkIn && checkOut && date > checkIn && date < checkOut
    const inHover = effectiveHover && date > checkIn && date < effectiveHover
    const isHoverEnd = date === effectiveHover

    let bg = 'transparent'
    let color = '#1A1A1A'
    let cursor: React.CSSProperties['cursor'] = 'pointer'
    let fontWeight: number = 400
    let border = 'none'

    if (isPast) {
      color = '#C8C4BC'
      cursor = 'default'
    } else if (booked) {
      bg = '#fee2e2'
      color = '#dc2626'
      cursor = 'not-allowed'
      fontWeight = 600
    } else if (isCI || isCO) {
      bg = '#C4603C'
      color = '#fff'
      fontWeight = 700
    } else if (inRange) {
      bg = 'rgba(196,96,60,0.18)'
      color = '#C4603C'
      fontWeight = 500
    } else if (isHoverEnd) {
      bg = 'rgba(232,132,94,0.85)'
      color = '#fff'
      fontWeight = 600
    } else if (inHover) {
      bg = 'rgba(232,132,94,0.28)'
      color = '#b85030'
    } else {
      border = '1px solid transparent'
    }

    return {
      width: '40px', height: '40px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: '0.5rem', fontSize: '0.88rem',
      cursor, fontWeight, backgroundColor: bg, color, border,
      transition: 'background-color 0.08s',
      userSelect: 'none',
      position: 'relative',
    }
  }

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDow = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7
  const cells = Math.ceil((firstDow + daysInMonth) / 7) * 7
  const todayFull = todayStr()

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  return (
    <div>
      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <button onClick={prevMonth} style={navBtn}>‹</button>
        <span className="font-display" style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1A1A1A' }}>
          {MONTHS_IT[viewMonth]} {viewYear}
        </span>
        <button onClick={nextMonth} style={navBtn}>›</button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '0.4rem' }}>
        {DAYS_IT.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#9B9B8A', padding: '0.2rem 0', letterSpacing: '0.04em' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
        {Array.from({ length: cells }).map((_, i) => {
          const day = i - firstDow + 1
          if (day < 1 || day > daysInMonth) {
            return <div key={i} style={{ height: '40px' }} />
          }
          const date = toStr(viewYear, viewMonth, day)
          const isToday = date === todayFull

          return (
            <div key={i} style={{ display: 'flex', justifyContent: 'center' }}>
              <div
                style={getDayStyle(date)}
                onClick={() => handleClick(date)}
                onMouseEnter={() => setHoverDate(date)}
                onMouseLeave={() => setHoverDate(null)}
              >
                {day}
                {isToday && (
                  <span style={{
                    position: 'absolute', bottom: '4px', left: '50%', transform: 'translateX(-50%)',
                    width: '4px', height: '4px', borderRadius: '50%',
                    backgroundColor: date === checkIn || date === checkOut ? '#fff' : '#C4603C',
                  }} />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #f0ebe0' }}>
        <LegendItem bg="#fee2e2" color="#dc2626" label="Occupato" />
        <LegendItem bg="rgba(232,132,94,0.28)" color="#b85030" label="Anteprima" />
        <LegendItem bg="#C4603C" color="#fff" label="Selezionato" />
      </div>

      {/* Hint */}
      <p style={{ fontSize: '0.8rem', color: '#9B9B8A', marginTop: '0.75rem', minHeight: '1.2em' }}>
        {!checkIn && 'Clicca un giorno per scegliere il check-in'}
        {checkIn && !checkOut && `Check-in: ${checkIn} — ora clicca il check-out`}
        {checkIn && checkOut && `✓ ${checkIn} → ${checkOut}`}
      </p>

      {loading && (
        <p style={{ fontSize: '0.78rem', color: '#9B9B8A' }}>Caricamento disponibilità...</p>
      )}
    </div>
  )
}

const navBtn: React.CSSProperties = {
  background: 'none', border: '1px solid #e8e4dc', borderRadius: '0.5rem',
  padding: '0.3rem 0.8rem', cursor: 'pointer', fontSize: '1.3rem', color: '#6B6B5A',
  lineHeight: 1,
}

function LegendItem({ bg, color, label }: { bg: string; color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: bg, border: '1px solid rgba(0,0,0,0.06)' }} />
      <span style={{ fontSize: '0.75rem', color: '#6B6B5A' }}>{label}</span>
    </div>
  )
}
