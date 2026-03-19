export type RoomInfo = {
  images: string[]
  features: string[]
  size: string
  badge: string
}

export const ROOM_DATA: Record<string, RoomInfo> = {
  'Camera dei Limoni': {
    size: '14 m²',
    badge: 'Matrimoniale',
    images: [
      'https://lelimonaieincentro.it/wp-content/uploads/2025/03/585397072.jpg',
      'https://lelimonaieincentro.it/wp-content/uploads/2025/04/WhatsApp-Image-2025-04-15-at-17.41.37-2.jpeg',
      'https://lelimonaieincentro.it/wp-content/uploads/2025/03/585397100.jpg',
      'https://lelimonaieincentro.it/wp-content/uploads/2025/03/585397068.jpg',
      'https://lelimonaieincentro.it/wp-content/uploads/2025/04/WhatsApp-Image-2025-04-15-at-17.41.36-4.jpeg',
      'https://lelimonaieincentro.it/wp-content/uploads/2025/04/1080416d-6d57-4494-b824-2b841d3acc61.jpeg',
    ],
    features: [
      '🌡️ Aria condizionata',
      '🔇 Insonorizzata',
      '📺 TV schermo piatto',
      '🚿 Bagno privato con doccia',
      '🧴 Prodotti di cortesia',
      '📶 Wi-Fi gratuito',
      '👕 Armadio',
      '🏙️ Vista sulla città',
    ],
  },
  'Camera dei Papaveri': {
    size: '14 m²',
    badge: 'Matrimoniale con balcone',
    images: [
      'https://lelimonaieincentro.it/wp-content/uploads/2025/03/585397032.jpg',
      'https://lelimonaieincentro.it/wp-content/uploads/2025/04/WhatsApp-Image-2025-04-15-at-17.41.36-1.jpeg',
      'https://lelimonaieincentro.it/wp-content/uploads/2025/03/585396990.jpg',
      'https://lelimonaieincentro.it/wp-content/uploads/2025/03/585665156.jpg',
      'https://lelimonaieincentro.it/wp-content/uploads/2025/03/585665286.jpg',
      'https://lelimonaieincentro.it/wp-content/uploads/2025/04/WhatsApp-Image-2025-04-15-at-17.41.36.jpeg',
    ],
    features: [
      '🌡️ Aria condizionata',
      '🔇 Insonorizzata',
      '📺 TV schermo piatto',
      '🚿 Bagno privato con doccia',
      '🌿 Balcone con vista città',
      '🧴 Prodotti di cortesia',
      '📶 Wi-Fi gratuito',
      '👕 Armadio',
    ],
  },
  'Suite delle Rose': {
    size: '22 m²',
    badge: 'Suite · Max 3 persone',
    images: [
      'https://lelimonaieincentro.it/wp-content/uploads/2025/04/WhatsApp-Image-2025-04-15-at-17.41.35-2.jpeg',
      'https://lelimonaieincentro.it/wp-content/uploads/2025/04/WhatsApp-Image-2025-04-15-at-17.41.33-1.jpeg',
      'https://lelimonaieincentro.it/wp-content/uploads/2025/04/WhatsApp-Image-2025-04-15-at-17.41.34-3.jpeg',
      'https://lelimonaieincentro.it/wp-content/uploads/2025/04/WhatsApp-Image-2025-04-15-at-17.41.34-2.jpeg',
      'https://lelimonaieincentro.it/wp-content/uploads/2025/04/WhatsApp-Image-2025-04-15-at-17.41.35-3.jpeg',
      'https://lelimonaieincentro.it/wp-content/uploads/2025/03/585665102.jpg',
    ],
    features: [
      '🛏️ Camera + soggiorno separati',
      '🛋️ Divano letto (fino a 3 persone)',
      '🌡️ Aria condizionata',
      '🔇 Insonorizzata',
      '📺 TV schermo piatto',
      '🚿 Bagno privato con set cortesia',
      '🌿 Balcone con vista città',
      '📶 Wi-Fi gratuito',
    ],
  },
  'Country House Completa': {
    size: 'Villa intera',
    badge: 'Intera proprietà · Max 8 persone',
    images: [
      'https://lelimonaieincentro.it/wp-content/uploads/2025/04/b-b-Country-House-min.jpg',
    ],
    features: [
      '🏊 Piscina privata',
      '🌊 Vista mare e colline',
      '🍽️ Ristorazione',
      '🌿 Immersa nella natura',
      '🚗 Ampio parcheggio',
      '👨‍👩‍👧‍👦 Ideale famiglie e gruppi',
      '📶 Wi-Fi gratuito',
      '❄️ Aria condizionata',
    ],
  },
}
