'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDF8F0', color: '#1A1A1A' }}>
      {/* Hero Section */}
      <section
        style={{
          background: 'linear-gradient(135deg, #2D4A3E 0%, #4A7A6A 40%, #C4603C 100%)',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4rem 2rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: '-10%', right: '-5%',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'rgba(200, 160, 80, 0.15)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-15%', left: '-8%',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'rgba(253, 248, 240, 0.08)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', textAlign: 'center', maxWidth: '800px' }}>
          {/* Lemon icon */}
          <div style={{ fontSize: '3rem', marginBottom: '1.5rem', opacity: 0.9 }}>🍋</div>

          <h1
            className="font-display"
            style={{
              fontSize: 'clamp(3rem, 8vw, 6rem)',
              fontWeight: 700,
              color: '#FDF8F0',
              lineHeight: 1.1,
              marginBottom: '1rem',
              letterSpacing: '-0.02em',
            }}
          >
            Le Limonaie
          </h1>

          <p
            className="font-display"
            style={{
              fontSize: 'clamp(1.1rem, 3vw, 1.5rem)',
              color: 'rgba(253, 248, 240, 0.85)',
              fontStyle: 'italic',
              marginBottom: '1rem',
              fontWeight: 400,
            }}
          >
            Due proprietà, un&apos;unica ospitalità
          </p>

          <p style={{
            fontSize: '1rem',
            color: 'rgba(253, 248, 240, 0.65)',
            marginBottom: '3rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            fontWeight: 500,
          }}>
            San Benedetto del Tronto, Marche
          </p>

          <a
            href="#proprieta"
            style={{
              display: 'inline-block',
              padding: '0.875rem 2.5rem',
              backgroundColor: '#C8A050',
              color: '#FDF8F0',
              borderRadius: '9999px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              letterSpacing: '0.05em',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#b08840')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#C8A050')}
          >
            Scopri le proprietà ↓
          </a>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute', bottom: '2rem',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
        }}>
          <div style={{
            width: '1px', height: '60px',
            background: 'linear-gradient(to bottom, transparent, rgba(253,248,240,0.4))',
          }} />
        </div>
      </section>

      {/* Properties Section */}
      <section id="proprieta" style={{ padding: '6rem 2rem', backgroundColor: '#FDF8F0' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <p style={{
              fontSize: '0.85rem', letterSpacing: '0.2em', textTransform: 'uppercase',
              color: '#C4603C', fontWeight: 600, marginBottom: '0.75rem',
            }}>
              Le nostre strutture
            </p>
            <h2
              className="font-display"
              style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700, color: '#1A1A1A' }}
            >
              Scegli la tua esperienza
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2rem',
          }}>
            {/* Property 1 — Centro */}
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '1.5rem',
              overflow: 'hidden',
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
              border: '1px solid #f0ebe0',
              display: 'flex',
              flexDirection: 'column',
            }}>
              {/* Real room photo */}
              <div style={{ height: '240px', position: 'relative', overflow: 'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://lelimonaieincentro.it/wp-content/uploads/2025/03/585397032.jpg"
                  alt="Camera dei Papaveri — Le Limonaie in Centro"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 60%)' }} />
                <div style={{ position: 'absolute', bottom: '1rem', left: '1.25rem' }}>
                  <span style={{ color: '#fff', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                    Centro storico · San Benedetto del Tronto
                  </span>
                </div>
              </div>

              <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <span style={{
                    backgroundColor: '#FDF8F0', color: '#2D4A3E',
                    padding: '0.25rem 0.75rem', borderRadius: '9999px',
                    fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                    border: '1px solid #c8e0d8',
                  }}>
                    Affittacamere
                  </span>
                </div>

                <h3
                  className="font-display"
                  style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1A1A1A', margin: '0.75rem 0 0.75rem' }}
                >
                  Le Limonaie in Centro
                </h3>

                <p style={{ color: '#6B6B5A', lineHeight: 1.7, marginBottom: '1.5rem', flex: 1 }}>
                  Nel cuore di San Benedetto del Tronto, nella zona pedonale, a soli 5 minuti a piedi dal mare.
                  Tre camere eleganti con bagno privato, aria condizionata e insonorizzazione.
                </p>

                <div style={{ marginBottom: '1.5rem' }}>
                  {['3 camere con bagno privato', '5 minuti dal mare', 'Zona pedonale', 'Aria condizionata'].map(feature => (
                    <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <span style={{ color: '#4A7A6A', fontWeight: 600 }}>✓</span>
                      <span style={{ color: '#6B6B5A', fontSize: '0.9rem' }}>{feature}</span>
                    </div>
                  ))}
                </div>

                <p style={{ fontSize: '0.8rem', color: '#9B9B8A', marginBottom: '1rem' }}>
                  📍 Via Mazzocchi, 7 — San Benedetto del Tronto (AP)
                </p>

                <div style={{ borderTop: '1px solid #f0ebe0', paddingTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#9B9B8A' }}>Da</span>
                    <span className="font-mono-custom" style={{ fontSize: '1.4rem', fontWeight: 600, color: '#C4603C', marginLeft: '0.4rem' }}>
                      €60
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#9B9B8A' }}>/notte</span>
                  </div>
                  <Link
                    href="/prenota?property=centro"
                    style={{
                      backgroundColor: '#C4603C',
                      color: '#fff',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '0.75rem',
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      display: 'inline-block',
                    }}
                  >
                    Prenota ora →
                  </Link>
                </div>
              </div>
            </div>

            {/* Property 2 — Country House */}
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '1.5rem',
              overflow: 'hidden',
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
              border: '1px solid #f0ebe0',
              display: 'flex',
              flexDirection: 'column',
            }}>
              {/* Real country house photo */}
              <div style={{ height: '240px', position: 'relative', overflow: 'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://lelimonaieincentro.it/wp-content/uploads/2025/04/b-b-Country-House-min.jpg"
                  alt="Country House Le Limonaie a Mare"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 60%)' }} />
                <div style={{ position: 'absolute', bottom: '1rem', left: '1.25rem' }}>
                  <span style={{ color: '#fff', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                    Campagna & mare · C.da Santa Lucia
                  </span>
                </div>
              </div>

              <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <span style={{
                    backgroundColor: '#FDF8F0', color: '#C4603C',
                    padding: '0.25rem 0.75rem', borderRadius: '9999px',
                    fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                    border: '1px solid #f0d0c0',
                  }}>
                    Country House
                  </span>
                </div>

                <h3
                  className="font-display"
                  style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1A1A1A', margin: '0.75rem 0 0.75rem' }}
                >
                  Country House a Mare
                </h3>

                <p style={{ color: '#6B6B5A', lineHeight: 1.7, marginBottom: '1.5rem', flex: 1 }}>
                  Villa rurale ristrutturata su antico casale, immersa nel verde delle colline marchigiane
                  con splendida vista sul mare. Piscina privata e ristorazione. Ideale per famiglie e gruppi.
                </p>

                <div style={{ marginBottom: '1.5rem' }}>
                  {['Piscina privata', 'Vista mare e colline', 'Ristorazione', 'Fino a 8 ospiti'].map(feature => (
                    <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <span style={{ color: '#C4603C', fontWeight: 600 }}>✓</span>
                      <span style={{ color: '#6B6B5A', fontSize: '0.9rem' }}>{feature}</span>
                    </div>
                  ))}
                </div>

                <p style={{ fontSize: '0.8rem', color: '#9B9B8A', marginBottom: '1rem' }}>
                  📍 C.da Santa Lucia, 28 — San Benedetto del Tronto (AP)
                </p>

                <div style={{ borderTop: '1px solid #f0ebe0', paddingTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#9B9B8A' }}>Da</span>
                    <span className="font-mono-custom" style={{ fontSize: '1.4rem', fontWeight: 600, color: '#C4603C', marginLeft: '0.4rem' }}>
                      €200
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#9B9B8A' }}>/notte</span>
                  </div>
                  <Link
                    href="/prenota?property=countryhouse"
                    style={{
                      backgroundColor: '#C4603C',
                      color: '#fff',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '0.75rem',
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      display: 'inline-block',
                    }}
                  >
                    Prenota ora →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chi Siamo */}
      <section style={{
        padding: '6rem 2rem',
        background: 'linear-gradient(180deg, #2D4A3E 0%, #1e3329 100%)',
        color: '#FDF8F0',
      }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{
            fontSize: '0.85rem', letterSpacing: '0.2em', textTransform: 'uppercase',
            color: '#C8A050', fontWeight: 600, marginBottom: '0.75rem',
          }}>
            Chi siamo
          </p>
          <h2
            className="font-display"
            style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 700, marginBottom: '1.5rem', lineHeight: 1.3 }}
          >
            Ospitalità autentica,<br />
            <em>cuore marchigiano</em>
          </h2>
          <p style={{ color: 'rgba(253,248,240,0.75)', lineHeight: 1.9, fontSize: '1.05rem', marginBottom: '1.5rem' }}>
            Le Limonaie nasce dalla passione per la nostra terra e per l&apos;accoglienza genuina.
            Offriamo due esperienze complementari: la vita cittadina del centro storico di San Benedetto,
            e la quiete della campagna con vista sul mare Adriatico.
          </p>
          <p style={{ color: 'rgba(253,248,240,0.65)', lineHeight: 1.9, fontSize: '1rem' }}>
            Ogni ospite è una storia. Siamo qui per renderla indimenticabile.
          </p>
        </div>
      </section>

      {/* Contact & Footer */}
      <footer style={{
        backgroundColor: '#1A1A1A',
        color: 'rgba(253,248,240,0.7)',
        padding: '4rem 2rem 3rem',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '3rem',
            marginBottom: '3rem',
          }}>
            {/* Brand */}
            <div>
              <h3
                className="font-display"
                style={{ color: '#FDF8F0', fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem' }}
              >
                Le Limonaie
              </h3>
              <p style={{ lineHeight: 1.8, fontSize: '0.9rem' }}>
                Due strutture, un&apos;unica ospitalità.<br />
                San Benedetto del Tronto, Marche, Italia.
              </p>
            </div>

            {/* Contatti */}
            <div>
              <h4 style={{ color: '#C8A050', fontWeight: 600, marginBottom: '1rem', fontSize: '0.85rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                Contatti
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                <a href="tel:+393395966527" style={{ color: 'rgba(253,248,240,0.7)', textDecoration: 'none' }}>
                  📞 +39 339 59 66 527
                </a>
                <a href="tel:+393395726514" style={{ color: 'rgba(253,248,240,0.7)', textDecoration: 'none' }}>
                  📞 +39 339 57 26 514
                </a>
                <a href="mailto:info@lelimonaieamare.it" style={{ color: 'rgba(253,248,240,0.7)', textDecoration: 'none' }}>
                  ✉️ info@lelimonaieamare.it
                </a>
              </div>
            </div>

            {/* Sedi */}
            <div>
              <h4 style={{ color: '#C8A050', fontWeight: 600, marginBottom: '1rem', fontSize: '0.85rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                Le nostre sedi
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
                <div>
                  <div style={{ color: '#FDF8F0', fontWeight: 500, marginBottom: '0.2rem' }}>Le Limonaie in Centro</div>
                  <div>Via Mazzocchi, 7 — San Benedetto del Tronto (AP)</div>
                </div>
                <div>
                  <div style={{ color: '#FDF8F0', fontWeight: 500, marginBottom: '0.2rem' }}>Country House a Mare</div>
                  <div>C.da Santa Lucia, 28 — San Benedetto del Tronto (AP)</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{
            borderTop: '1px solid rgba(253,248,240,0.1)',
            paddingTop: '2rem',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            fontSize: '0.8rem',
          }}>
            <span>© {new Date().getFullYear()} Le Limonaie. Tutti i diritti riservati.</span>
            <Link href="/admin" style={{ color: 'rgba(253,248,240,0.3)', textDecoration: 'none', fontSize: '0.75rem' }}>
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
