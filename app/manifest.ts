import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Le Limonaie',
    short_name: 'Le Limonaie',
    description: 'Prenota il tuo soggiorno · San Benedetto del Tronto',
    start_url: '/',
    display: 'standalone',
    background_color: '#FDF8F0',
    theme_color: '#2D4A3E',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
