export type Property = {
  id: string
  slug: string
  name: string
  address: string | null
  description: string | null
  created_at: string
}

export type Room = {
  id: string
  property_id: string
  name: string
  description: string | null
  capacity: number
  price_low_season: number
  price_mid_season: number
  price_high_season: number
  created_at: string
}

export type Booking = {
  id: string
  room_id: string
  guest_name: string
  guest_email: string
  guest_phone: string
  check_in: string
  check_out: string
  notes: string | null
  status: 'pending' | 'confirmed' | 'cancelled'
  total_price: number
  created_at: string
  rooms?: Room & { properties?: Property }
}

export type BookingFormData = {
  room_id: string
  guest_name: string
  guest_email: string
  guest_phone: string
  check_in: string
  check_out: string
  notes: string
  total_price: number
}
