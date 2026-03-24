import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        background: 'linear-gradient(135deg, #2D4A3E 0%, #3d6456 100%)',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '36px',
      }}
    >
      <div
        style={{
          color: '#C8A050',
          fontSize: 84,
          fontWeight: 900,
          lineHeight: 1,
          display: 'flex',
          letterSpacing: '-0.05em',
        }}
      >
        LL
      </div>
      <div
        style={{
          color: 'rgba(253,248,240,0.6)',
          fontSize: 18,
          fontWeight: 400,
          letterSpacing: '0.2em',
          display: 'flex',
          marginTop: 4,
        }}
      >
        LIMONAIE
      </div>
    </div>,
    { ...size }
  )
}
