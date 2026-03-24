'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (res.ok) {
        router.push('/admin')
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error || 'Credenziali non valide.')
      }
    } catch {
      setError('Errore di connessione.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#FDF8F0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: 700, color: '#1A1A1A', marginBottom: '0.5rem' }}>
            Le Limonaie
          </h1>
          <p style={{ color: '#6B6B5A', fontSize: '0.9rem' }}>Pannello amministrativo</p>
        </div>

        <div style={{
          backgroundColor: '#fff',
          borderRadius: '1.25rem',
          padding: '2rem',
          border: '1px solid #f0ebe0',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#1A1A1A' }}>
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@lelimonaie.it"
                autoComplete="email"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#C4603C')}
                onBlur={e => (e.target.style.borderColor = '#d4cfc8')}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#1A1A1A' }}>
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#C4603C')}
                onBlur={e => (e.target.style.borderColor = '#d4cfc8')}
              />
            </div>

            {error && (
              <div style={{
                backgroundColor: '#fef2ee', border: '1px solid #f0c0b0', borderRadius: '0.75rem',
                padding: '0.75rem 1rem', color: '#C4603C', fontSize: '0.85rem', marginBottom: '1rem',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '0.875rem',
                backgroundColor: loading ? '#b85030' : '#C4603C',
                color: '#fff', border: 'none', borderRadius: '0.75rem',
                fontWeight: 700, fontSize: '1rem',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Accesso...' : 'Accedi →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  border: '1.5px solid #d4cfc8',
  borderRadius: '0.75rem',
  fontSize: '1rem',
  color: '#1A1A1A',
  backgroundColor: '#fff',
  outline: 'none',
  boxSizing: 'border-box',
}
