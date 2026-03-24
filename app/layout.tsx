import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Le Limonaie — San Benedetto del Tronto',
  description: 'Prenotazione online per Le Limonaie in Centro e Country House Le Limonaie a Mare — San Benedetto del Tronto (AP)',
  keywords: 'affittacamere, bed and breakfast, San Benedetto del Tronto, country house, Marche, costa adriatica',
  appleWebApp: {
    capable: true,
    title: 'Le Limonaie',
    statusBarStyle: 'black-translucent',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
