import { createHmac } from 'crypto'

export function generateActionToken(bookingId: string, action: string): string {
  const secret = process.env.ADMIN_PASSWORD || 'limonaie-secret'
  return createHmac('sha256', secret)
    .update(`${bookingId}:${action}`)
    .digest('hex')
    .slice(0, 24)
}

export function verifyActionToken(bookingId: string, action: string, token: string): boolean {
  return generateActionToken(bookingId, action) === token
}
