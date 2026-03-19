import { Room } from './types'

type Season = 'low' | 'mid' | 'high'

function getSeason(date: Date): Season {
  const month = date.getMonth() + 1 // 1-12
  const day = date.getDate()

  // Alta stagione: 28 luglio – 27 agosto
  if ((month === 7 && day >= 28) || (month === 8 && day <= 27)) {
    return 'high'
  }

  // Media stagione: 28 giugno – 27 luglio  OR  28 agosto – 14 settembre
  if (
    (month === 6 && day >= 28) ||
    (month === 7 && day <= 27) ||
    (month === 8 && day >= 28) ||
    (month === 9 && day <= 14)
  ) {
    return 'mid'
  }

  // Bassa stagione: tutto il resto (15 sett – 27 giugno)
  return 'low'
}

export function getPricePerNight(checkIn: Date, room: Room): number {
  const season = getSeason(checkIn)
  switch (season) {
    case 'high':
      return room.price_high_season
    case 'mid':
      return room.price_mid_season
    case 'low':
    default:
      return room.price_low_season
  }
}

export function calculateTotalPrice(
  checkIn: Date,
  checkOut: Date,
  room: Room
): number {
  const nights = Math.round(
    (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
  )
  if (nights <= 0) return 0

  // Use check-in date's season for simplicity (standard practice)
  const pricePerNight = getPricePerNight(checkIn, room)
  let total = pricePerNight * nights

  // Supplemento per soggiorno di 1 notte (minimum is 2, but handle edge case)
  if (nights === 1) {
    total += 15
  }

  return total
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(price)
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('it-IT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
