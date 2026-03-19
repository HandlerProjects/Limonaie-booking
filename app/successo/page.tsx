import { Suspense } from 'react'
import SuccessoClient from './SuccessoClient'

export default function SuccessoPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', backgroundColor: '#FDF8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#6B6B5A' }}>Caricamento...</p>
      </div>
    }>
      <SuccessoClient />
    </Suspense>
  )
}
