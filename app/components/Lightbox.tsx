'use client'

import { useEffect, useState, useCallback } from 'react'

type Props = {
  images: string[]
  startIndex: number
  roomName: string
  onClose: () => void
}

export default function Lightbox({ images, startIndex, roomName, onClose }: Props) {
  const [idx, setIdx] = useState(startIndex)
  const [visible, setVisible] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  // Fade in on mount
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  // Reset img loaded when index changes
  useEffect(() => { setImgLoaded(false) }, [idx])

  const close = useCallback(() => {
    setVisible(false)
    setTimeout(onClose, 280)
  }, [onClose])

  const prev = useCallback(() => setIdx(i => (i - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setIdx(i => (i + 1) % images.length), [images.length])

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close, prev, next])

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      onClick={close}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        backgroundColor: `rgba(0,0,0,${visible ? 0.92 : 0})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background-color 0.28s ease',
        cursor: 'zoom-out',
      }}
    >
      {/* Close button */}
      <button
        onClick={close}
        style={{
          position: 'fixed', top: '1.25rem', right: '1.25rem',
          width: '44px', height: '44px', borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.25)',
          color: '#fff', fontSize: '1.3rem', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1001, transition: 'background-color 0.2s ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)')}
      >
        ✕
      </button>

      {/* Counter */}
      <div style={{
        position: 'fixed', top: '1.25rem', left: '50%', transform: 'translateX(-50%)',
        color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem', fontWeight: 500,
        backgroundColor: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)',
        padding: '0.35rem 1rem', borderRadius: '9999px',
        zIndex: 1001,
      }}>
        {roomName} · {idx + 1} / {images.length}
      </div>

      {/* Left arrow */}
      {images.length > 1 && (
        <button
          onClick={e => { e.stopPropagation(); prev() }}
          style={navArrow('left')}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)')}
        >
          ‹
        </button>
      )}

      {/* Photo */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative', cursor: 'default',
          maxWidth: '90vw', maxHeight: '88vh',
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.92)',
          transition: 'opacity 0.28s ease, transform 0.28s ease',
        }}
      >
        {/* Skeleton loader */}
        {!imgLoaded && (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderRadius: '0.75rem',
            animation: 'pulse 1.5s ease-in-out infinite',
            minWidth: '320px', minHeight: '240px',
          }} />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[idx]}
          alt={`${roomName} — foto ${idx + 1}`}
          onLoad={() => setImgLoaded(true)}
          style={{
            maxWidth: '90vw', maxHeight: '88vh',
            width: 'auto', height: 'auto',
            borderRadius: '0.75rem',
            boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
            display: 'block',
            opacity: imgLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        />
      </div>

      {/* Right arrow */}
      {images.length > 1 && (
        <button
          onClick={e => { e.stopPropagation(); next() }}
          style={navArrow('right')}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)')}
        >
          ›
        </button>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: '8px', zIndex: 1001,
            opacity: visible ? 1 : 0, transition: 'opacity 0.35s ease 0.1s',
          }}
        >
          {images.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt=""
              onClick={() => setIdx(i)}
              style={{
                width: i === idx ? '60px' : '48px',
                height: i === idx ? '44px' : '36px',
                objectFit: 'cover',
                borderRadius: '6px',
                cursor: 'pointer',
                opacity: i === idx ? 1 : 0.5,
                border: i === idx ? '2px solid #fff' : '2px solid transparent',
                transition: 'all 0.2s ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function navArrow(side: 'left' | 'right'): React.CSSProperties {
  return {
    position: 'fixed', [side]: '1.5rem', top: '50%', transform: 'translateY(-50%)',
    width: '52px', height: '52px', borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: '#fff', fontSize: '1.8rem', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1001, transition: 'background-color 0.2s ease',
  }
}
