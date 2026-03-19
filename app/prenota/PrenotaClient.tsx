'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Room } from '@/lib/types'
import { calculateTotalPrice, formatPrice } from '@/lib/pricing'
import BookingCalendar from '@/app/components/BookingCalendar'
import { ROOM_DATA } from '@/lib/roomData'

type PropertyData = {
  id: string
  slug: string
  name: string
  address: string
  description: string
  rooms: Room[]
}

const STEPS = ['Camera', 'Date', 'Dati personali']

// Photo gallery inside each room card
function RoomGallery({ images, roomName }: { images: string[]; roomName: string }) {
  const [idx, setIdx] = useState(0)
  if (!images.length) return null

  return (
    <div style={{ position: 'relative', height: '220px', borderRadius: '0.875rem 0.875rem 0 0', overflow: 'hidden', flexShrink: 0 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[idx]}
        alt={`${roomName} - foto ${idx + 1}`}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
      {images.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + images.length) % images.length) }}
            style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: '#fff', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >‹</button>
          <button
            onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % images.length) }}
            style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: '#fff', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >›</button>
          <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '5px' }}>
            {images.map((_, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); setIdx(i) }}
                style={{ width: '7px', height: '7px', borderRadius: '50%', border: 'none', cursor: 'pointer', backgroundColor: i === idx ? '#fff' : 'rgba(255,255,255,0.5)', padding: 0 }}
              />
            ))}
          </div>
          <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: '0.72rem', padding: '2px 8px', borderRadius: '9999px' }}>
            {idx + 1}/{images.length}
          </div>
        </>
      )}
    </div>
  )
}

export default function PrenotaClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const propertySlug = searchParams.get('property') || 'centro'

  const [step, setStep] = useState(1)
  const [property, setProperty] = useState<PropertyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [dateError, setDateError] = useState('')
  const [availabilityError, setAvailabilityError] = useState('')
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [totalPrice, setTotalPrice] = useState<number | null>(null)

  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/properties?slug=${propertySlug}`)
        if (!res.ok) throw new Error()
        const data = await res.json()
        setProperty(data)
      } catch {
        setError('Impossibile caricare le informazioni. Riprova.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [propertySlug])

  useEffect(() => {
    if (selectedRoom && checkIn && checkOut) {
      const ci = new Date(checkIn)
      const co = new Date(checkOut)
      const nights = Math.round((co.getTime() - ci.getTime()) / 86400000)
      if (nights >= 1) setTotalPrice(calculateTotalPrice(ci, co, selectedRoom))
      else setTotalPrice(null)
    } else {
      setTotalPrice(null)
    }
  }, [selectedRoom, checkIn, checkOut])

  const checkAvailability = useCallback(async (): Promise<boolean> => {
    if (!selectedRoom || !checkIn || !checkOut) return true
    setCheckingAvailability(true)
    setAvailabilityError('')
    try {
      const res = await fetch(`/api/availability?room_id=${selectedRoom.id}&check_in=${checkIn}&check_out=${checkOut}`)
      const data = await res.json()
      if (!data.available) {
        setAvailabilityError('Le date selezionate non sono disponibili — scegli altre date.')
        return false
      }
      return true
    } catch { return true }
    finally { setCheckingAvailability(false) }
  }, [selectedRoom, checkIn, checkOut])

  function validateDates(): boolean {
    setDateError('')
    if (!checkIn || !checkOut) { setDateError('Seleziona le date di check-in e check-out.'); return false }
    const nights = Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)
    if (nights < 2) { setDateError('Il soggiorno minimo è di 2 notti.'); return false }
    return true
  }

  async function handleNextFromDates() {
    if (!validateDates()) return
    const available = await checkAvailability()
    if (available) setStep(3)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!acceptTerms) { setSubmitError('Devi accettare le condizioni di prenotazione.'); return }
    if (!selectedRoom || !checkIn || !checkOut) return
    setSubmitting(true); setSubmitError('')
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: selectedRoom.id, guest_name: guestName, guest_email: guestEmail, guest_phone: guestPhone, check_in: checkIn, check_out: checkOut, notes, total_price: totalPrice }),
      })
      const data = await res.json()
      if (!res.ok) { setSubmitError(data.error || 'Errore durante la prenotazione. Riprova.'); return }
      const params = new URLSearchParams({ id: data.id, name: guestName, email: guestEmail, property: property?.name || '', room: selectedRoom.name, check_in: checkIn, check_out: checkOut, price: String(totalPrice || 0) })
      router.push(`/successo?${params.toString()}`)
    } catch { setSubmitError('Errore di connessione. Riprova.') }
    finally { setSubmitting(false) }
  }

  const nights = checkIn && checkOut
    ? Math.max(0, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    : 0

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FDF8F0' }}>
      <header style={headerStyle}><Link href="/" className="font-display" style={logoStyle}>Le Limonaie</Link></header>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p style={{ color: '#6B6B5A' }}>Caricamento in corso...</p>
      </div>
    </div>
  )

  if (error || !property) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FDF8F0' }}>
      <header style={headerStyle}><Link href="/" className="font-display" style={logoStyle}>Le Limonaie</Link></header>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ color: '#C4603C' }}>{error || 'Struttura non trovata.'}</p>
        <Link href="/" style={{ color: '#2D4A3E' }}>← Torna alla home</Link>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FDF8F0' }}>
      <header style={headerStyle}>
        <Link href="/" className="font-display" style={logoStyle}>Le Limonaie</Link>
        <span style={{ color: 'rgba(253,248,240,0.7)', fontSize: '0.9rem' }}>{property.name}</span>
      </header>

      {/* Progress */}
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #f0ebe0', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {STEPS.map((label, i) => {
            const stepNum = i + 1
            const isActive = step === stepNum
            const isDone = step > stepNum
            return (
              <div key={stepNum} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isDone ? '#4A7A6A' : isActive ? '#C4603C' : '#e8e4dc', color: isDone || isActive ? '#fff' : '#9B9B8A', fontWeight: 700, fontSize: '0.9rem' }}>
                    {isDone ? '✓' : stepNum}
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: isActive ? 600 : 400, color: isActive ? '#C4603C' : isDone ? '#4A7A6A' : '#9B9B8A', whiteSpace: 'nowrap' }}>{label}</span>
                </div>
                {i < STEPS.length - 1 && <div style={{ width: '80px', height: '2px', margin: '0 0.5rem', marginBottom: '1.4rem', backgroundColor: step > stepNum ? '#4A7A6A' : '#e8e4dc' }} />}
              </div>
            )
          })}
        </div>
      </div>

      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '3rem 1.5rem' }}>

        {/* STEP 1 — Room selection with photos */}
        {step === 1 && (
          <div>
            <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Scegli la camera</h1>
            <p style={{ color: '#6B6B5A', marginBottom: '2.5rem' }}>{property.name} — {property.address}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {property.rooms.map(room => {
                const info = ROOM_DATA[room.name]
                const isSelected = selectedRoom?.id === room.id
                return (
                  <div
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    style={{
                      backgroundColor: '#fff',
                      border: isSelected ? '2px solid #C4603C' : '2px solid #f0ebe0',
                      borderRadius: '1rem', cursor: 'pointer',
                      boxShadow: isSelected ? '0 6px 24px rgba(196,96,60,0.18)' : '0 2px 12px rgba(0,0,0,0.05)',
                      transition: 'all 0.15s', overflow: 'hidden',
                    }}
                  >
                    {/* Photo gallery */}
                    {info?.images?.length > 0 && (
                      <RoomGallery images={info.images} roomName={room.name} />
                    )}

                    <div style={{ padding: '1.5rem' }}>
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div>
                          <h3 className="font-display" style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1A1A1A', marginBottom: '0.3rem' }}>
                            {room.name}
                          </h3>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {info?.badge && (
                              <span style={{ backgroundColor: '#FDF8F0', color: '#C4603C', border: '1px solid #f0d0c0', borderRadius: '9999px', padding: '0.2rem 0.7rem', fontSize: '0.75rem', fontWeight: 600 }}>
                                {info.badge}
                              </span>
                            )}
                            {info?.size && (
                              <span style={{ backgroundColor: '#f0f7f4', color: '#2D4A3E', border: '1px solid #c0ddd4', borderRadius: '9999px', padding: '0.2rem 0.7rem', fontSize: '0.75rem', fontWeight: 600 }}>
                                {info.size}
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div>
                            <span style={{ color: '#9B9B8A', fontSize: '0.8rem' }}>Da </span>
                            <span className="font-mono-custom" style={{ fontSize: '1.4rem', fontWeight: 700, color: '#C4603C' }}>€{room.price_low_season}</span>
                            <span style={{ color: '#9B9B8A', fontSize: '0.8rem' }}>/notte</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#9B9B8A' }}>Max {room.capacity} {room.capacity === 1 ? 'persona' : 'persone'}</div>
                        </div>
                      </div>

                      {/* Description */}
                      <p style={{ color: '#6B6B5A', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                        {room.description}
                      </p>

                      {/* Features */}
                      {info?.features && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: isSelected ? '1rem' : 0 }}>
                          {info.features.map(f => (
                            <span key={f} style={{ backgroundColor: '#f8f7f4', color: '#6B6B5A', border: '1px solid #e8e4dc', borderRadius: '0.5rem', padding: '0.3rem 0.7rem', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                              {f}
                            </span>
                          ))}
                        </div>
                      )}

                      {isSelected && (
                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f0ebe0', color: '#C4603C', fontWeight: 600, fontSize: '0.9rem' }}>
                          ✓ Camera selezionata
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => selectedRoom && setStep(2)} disabled={!selectedRoom} style={btnStyle(!selectedRoom)}>
                Continua → Scegli le date
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 — Calendar */}
        {step === 2 && selectedRoom && (
          <div>
            <button onClick={() => setStep(1)} style={backBtnStyle}>← Cambia camera</button>
            <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Scegli le date</h1>
            <p style={{ color: '#6B6B5A', marginBottom: '2rem' }}>Camera: <strong style={{ color: '#1A1A1A' }}>{selectedRoom.name}</strong></p>

            <div style={{ backgroundColor: '#fff', borderRadius: '1rem', padding: '2rem', border: '1px solid #f0ebe0', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <BookingCalendar
                roomId={selectedRoom.id}
                checkIn={checkIn}
                checkOut={checkOut}
                onChange={(ci, co) => { setCheckIn(ci); setCheckOut(co); setDateError(''); setAvailabilityError('') }}
              />
            </div>

            {nights >= 2 && totalPrice !== null && (
              <div style={{ backgroundColor: '#fff', borderRadius: '1rem', padding: '1.25rem 1.75rem', border: '1px solid #f0ebe0', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: '#6B6B5A', fontSize: '0.9rem' }}>{nights} {nights === 1 ? 'notte' : 'notti'} × {formatPrice(totalPrice / nights)}</div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1A1A1A' }}>Totale stimato</div>
                  <div style={{ fontSize: '0.75rem', color: '#9B9B8A' }}>Pagamento all&apos;arrivo</div>
                </div>
                <span className="font-mono-custom" style={{ fontSize: '2rem', fontWeight: 700, color: '#C4603C' }}>{formatPrice(totalPrice)}</span>
              </div>
            )}

            {dateError && <ErrorBox message={dateError} />}
            {availabilityError && <ErrorBox message={availabilityError} />}

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={handleNextFromDates} disabled={checkingAvailability || !checkIn || !checkOut} style={btnStyle(!checkIn || !checkOut)}>
                {checkingAvailability ? 'Verifica disponibilità...' : 'Continua → I tuoi dati'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Guest data */}
        {step === 3 && selectedRoom && (
          <div>
            <button onClick={() => setStep(2)} style={backBtnStyle}>← Modifica date</button>
            <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>I tuoi dati</h1>
            <p style={{ color: '#6B6B5A', marginBottom: '2rem' }}>Inserisci i tuoi dati per completare la prenotazione.</p>

            {/* Summary bar */}
            <div style={{ backgroundColor: '#2D4A3E', borderRadius: '1rem', padding: '1.25rem 1.5rem', marginBottom: '2rem', color: '#FDF8F0', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'space-between' }}>
              <div><div style={{ fontSize: '0.75rem', color: 'rgba(253,248,240,0.6)', marginBottom: '0.2rem' }}>Camera</div><div style={{ fontWeight: 600 }}>{selectedRoom.name}</div></div>
              <div><div style={{ fontSize: '0.75rem', color: 'rgba(253,248,240,0.6)', marginBottom: '0.2rem' }}>Check-in</div><div className="font-mono-custom" style={{ fontSize: '0.9rem' }}>{checkIn}</div></div>
              <div><div style={{ fontSize: '0.75rem', color: 'rgba(253,248,240,0.6)', marginBottom: '0.2rem' }}>Check-out</div><div className="font-mono-custom" style={{ fontSize: '0.9rem' }}>{checkOut}</div></div>
              {totalPrice !== null && <div><div style={{ fontSize: '0.75rem', color: 'rgba(253,248,240,0.6)', marginBottom: '0.2rem' }}>Totale</div><div className="font-mono-custom" style={{ fontSize: '1.1rem', fontWeight: 700, color: '#C8A050' }}>{formatPrice(totalPrice)}</div></div>}
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ backgroundColor: '#fff', borderRadius: '1rem', padding: '2rem', border: '1px solid #f0ebe0', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Nome completo *</label>
                    <input type="text" required value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Mario Rossi" style={inputStyle} onFocus={e => (e.target.style.borderColor = '#C4603C')} onBlur={e => (e.target.style.borderColor = '#d4cfc8')} />
                  </div>
                  <div>
                    <label style={labelStyle}>Email *</label>
                    <input type="email" required value={guestEmail} onChange={e => setGuestEmail(e.target.value)} placeholder="mario@esempio.it" style={inputStyle} onFocus={e => (e.target.style.borderColor = '#C4603C')} onBlur={e => (e.target.style.borderColor = '#d4cfc8')} />
                  </div>
                  <div>
                    <label style={labelStyle}>Telefono *</label>
                    <input type="tel" required value={guestPhone} onChange={e => setGuestPhone(e.target.value)} placeholder="+39 333 000 0000" style={inputStyle} onFocus={e => (e.target.style.borderColor = '#C4603C')} onBlur={e => (e.target.style.borderColor = '#d4cfc8')} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Note / richieste speciali</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Allergie, orario di arrivo previsto, richieste particolari..." rows={3} style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' } as React.CSSProperties} onFocus={e => (e.target.style.borderColor = '#C4603C')} onBlur={e => (e.target.style.borderColor = '#d4cfc8')} />
                  </div>
                </div>
                <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <input type="checkbox" id="terms" checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)} style={{ marginTop: '2px', width: '18px', height: '18px', accentColor: '#C4603C', flexShrink: 0 }} />
                  <label htmlFor="terms" style={{ fontSize: '0.9rem', color: '#6B6B5A', cursor: 'pointer', lineHeight: 1.5 }}>
                    Ho letto e accetto le condizioni di prenotazione. Il soggiorno è confermato al pagamento all&apos;arrivo. Per cancellazioni contattare entro 48 ore dall&apos;arrivo.
                  </label>
                </div>
              </div>

              {submitError && <ErrorBox message={submitError} />}

              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={submitting || !acceptTerms} style={{ padding: '1rem 3rem', backgroundColor: !acceptTerms ? '#d4cfc8' : submitting ? '#b85030' : '#C4603C', color: '#fff', border: 'none', borderRadius: '0.75rem', fontWeight: 700, fontSize: '1.05rem', cursor: (!acceptTerms || submitting) ? 'not-allowed' : 'pointer' }}>
                  {submitting ? 'Invio in corso...' : 'Conferma prenotazione →'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}

const headerStyle: React.CSSProperties = { backgroundColor: '#2D4A3E', padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }
const logoStyle: React.CSSProperties = { color: '#FDF8F0', textDecoration: 'none', fontSize: '1.5rem', fontWeight: 700 }
const labelStyle: React.CSSProperties = { display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#1A1A1A' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #d4cfc8', borderRadius: '0.75rem', fontSize: '1rem', color: '#1A1A1A', backgroundColor: '#fff', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }
const backBtnStyle: React.CSSProperties = { background: 'none', border: 'none', color: '#6B6B5A', cursor: 'pointer', marginBottom: '1.5rem', padding: 0, fontSize: '0.9rem' }
function btnStyle(disabled: boolean): React.CSSProperties { return { padding: '0.875rem 2.5rem', backgroundColor: disabled ? '#d4cfc8' : '#C4603C', color: '#fff', border: 'none', borderRadius: '0.75rem', fontWeight: 600, fontSize: '1rem', cursor: disabled ? 'not-allowed' : 'pointer' } }
function ErrorBox({ message }: { message: string }) {
  return <div style={{ backgroundColor: '#fef2ee', border: '1px solid #f0c0b0', borderRadius: '0.75rem', padding: '0.875rem 1rem', color: '#C4603C', fontSize: '0.9rem', marginTop: '1rem' }}>⚠️ {message}</div>
}
