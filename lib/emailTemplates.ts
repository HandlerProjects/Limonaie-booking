export function ownerNotificationEmail({
  guestName,
  guestPhone,
  guestEmail,
  roomName,
  checkIn,
  checkOut,
  nights,
  price,
  notes,
  confirmUrl,
  cancelUrl,
  siteUrl,
}: {
  guestName: string
  guestPhone: string
  guestEmail: string
  roomName: string
  checkIn: string
  checkOut: string
  nights: number
  price: string
  notes?: string | null
  confirmUrl: string
  cancelUrl: string
  siteUrl: string
}): string {
  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:20px;background:#F5F4F0;font-family:Georgia,serif;">
<div style="max-width:580px;margin:0 auto;">

  <!-- Header -->
  <div style="background:#2D4A3E;border-radius:16px 16px 0 0;padding:32px;text-align:center;">
    <div style="font-size:2.5rem;margin-bottom:8px;">🍋</div>
    <h1 style="color:#FDF8F0;margin:0 0 6px;font-size:1.6rem;font-weight:700;">Le Limonaie</h1>
    <p style="color:rgba(253,248,240,0.65);margin:0;font-size:0.9rem;letter-spacing:0.05em;">NUOVA RICHIESTA DI PRENOTAZIONE</p>
  </div>

  <!-- Body -->
  <div style="background:#FDF8F0;padding:32px;border-left:1px solid #e8e4dc;border-right:1px solid #e8e4dc;">

    <h2 style="color:#1A1A1A;margin:0 0 4px;font-size:1.5rem;">${guestName}</h2>
    <p style="color:#9B9B8A;margin:0 0 28px;font-size:0.9rem;">
      <a href="tel:${guestPhone}" style="color:#2D4A3E;font-weight:600;text-decoration:none;">${guestPhone}</a>
      &nbsp;·&nbsp;
      <a href="mailto:${guestEmail}" style="color:#2D4A3E;text-decoration:none;">${guestEmail}</a>
    </p>

    <!-- Booking details card -->
    <div style="background:#fff;border-radius:12px;border:1px solid #e8e4dc;padding:24px;margin-bottom:28px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="color:#9B9B8A;font-size:0.8rem;padding:7px 0;width:38%;text-transform:uppercase;letter-spacing:0.05em;">Camera</td>
          <td style="color:#1A1A1A;font-weight:700;font-size:0.95rem;">${roomName}</td>
        </tr>
        <tr style="border-top:1px solid #f0ece4;">
          <td style="color:#9B9B8A;font-size:0.8rem;padding:7px 0;text-transform:uppercase;letter-spacing:0.05em;">Check-in</td>
          <td style="color:#1A1A1A;font-size:0.95rem;">${checkIn} <span style="color:#9B9B8A;font-size:0.8rem;">dalle 15:00</span></td>
        </tr>
        <tr style="border-top:1px solid #f0ece4;">
          <td style="color:#9B9B8A;font-size:0.8rem;padding:7px 0;text-transform:uppercase;letter-spacing:0.05em;">Check-out</td>
          <td style="color:#1A1A1A;font-size:0.95rem;">${checkOut} <span style="color:#9B9B8A;font-size:0.8rem;">entro le 11:00</span></td>
        </tr>
        <tr style="border-top:1px solid #f0ece4;">
          <td style="color:#9B9B8A;font-size:0.8rem;padding:7px 0;text-transform:uppercase;letter-spacing:0.05em;">Durata</td>
          <td style="color:#1A1A1A;font-size:0.95rem;">${nights} nott${nights === 1 ? 'e' : 'i'}</td>
        </tr>
        <tr style="border-top:1px solid #f0ece4;">
          <td style="color:#9B9B8A;font-size:0.8rem;padding:7px 0;text-transform:uppercase;letter-spacing:0.05em;">Totale</td>
          <td style="color:#C4603C;font-weight:700;font-size:1.2rem;">${price}</td>
        </tr>
        ${notes ? `
        <tr style="border-top:1px solid #f0ece4;">
          <td style="color:#9B9B8A;font-size:0.8rem;padding:7px 0;text-transform:uppercase;letter-spacing:0.05em;">Note</td>
          <td style="color:#6B6B5A;font-size:0.9rem;">${notes}</td>
        </tr>` : ''}
      </table>
    </div>

    <!-- Action buttons -->
    <p style="color:#6B6B5A;text-align:center;margin:0 0 20px;font-size:0.95rem;">Rispondi con un solo clic:</p>
    <div style="text-align:center;margin-bottom:28px;">
      <a href="${confirmUrl}"
        style="display:inline-block;background:#166534;color:#fff;padding:16px 40px;border-radius:10px;text-decoration:none;font-weight:700;font-size:1rem;margin:0 6px 10px;letter-spacing:0.02em;">
        ✅ CONFERMA
      </a>
      <a href="${cancelUrl}"
        style="display:inline-block;background:#fef2ee;color:#C4603C;padding:14px 40px;border-radius:10px;text-decoration:none;font-weight:700;font-size:1rem;margin:0 6px 10px;border:2px solid #f0c0b0;letter-spacing:0.02em;">
        ❌ RIFIUTA
      </a>
    </div>
    <p style="color:#9B9B8A;font-size:0.8rem;text-align:center;margin:0;">
      Oppure gestisci dal <a href="${siteUrl}/admin" style="color:#2D4A3E;font-weight:600;">pannello admin</a>
    </p>
  </div>

  <!-- Footer -->
  <div style="background:#1A1A1A;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
    <p style="color:rgba(253,248,240,0.35);margin:0;font-size:0.75rem;">
      Le Limonaie · San Benedetto del Tronto (AP) · Italia
    </p>
  </div>

</div>
</body>
</html>`
}

export function guestConfirmEmail({
  guestName,
  roomName,
  checkIn,
  checkOut,
  nights,
  price,
}: {
  guestName: string
  roomName: string
  checkIn: string
  checkOut: string
  nights: number
  price: string
}): string {
  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:20px;background:#F5F4F0;font-family:Georgia,serif;">
<div style="max-width:580px;margin:0 auto;">

  <div style="background:#2D4A3E;border-radius:16px 16px 0 0;padding:32px;text-align:center;">
    <div style="font-size:2.5rem;margin-bottom:8px;">🍋</div>
    <h1 style="color:#FDF8F0;margin:0 0 6px;font-size:1.6rem;">Le Limonaie</h1>
    <p style="color:rgba(253,248,240,0.65);margin:0;font-size:0.9rem;">PRENOTAZIONE CONFERMATA</p>
  </div>

  <div style="background:#FDF8F0;padding:32px;border-left:1px solid #e8e4dc;border-right:1px solid #e8e4dc;">
    <div style="background:#dcfce7;border-radius:10px;padding:14px 20px;margin-bottom:24px;text-align:center;">
      <span style="color:#166534;font-weight:700;font-size:1rem;">✅ La tua prenotazione è confermata!</span>
    </div>

    <p style="color:#1A1A1A;margin:0 0 24px;font-size:1rem;">Ciao <strong>${guestName}</strong>, non vediamo l'ora di accoglierti!</p>

    <div style="background:#fff;border-radius:12px;border:1px solid #e8e4dc;padding:24px;margin-bottom:28px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="color:#9B9B8A;font-size:0.8rem;padding:7px 0;width:38%;text-transform:uppercase;letter-spacing:0.05em;">Camera</td>
          <td style="color:#1A1A1A;font-weight:700;">${roomName}</td>
        </tr>
        <tr style="border-top:1px solid #f0ece4;">
          <td style="color:#9B9B8A;font-size:0.8rem;padding:7px 0;text-transform:uppercase;letter-spacing:0.05em;">Check-in</td>
          <td style="color:#1A1A1A;">${checkIn} <span style="color:#9B9B8A;font-size:0.8rem;">dalle 15:00</span></td>
        </tr>
        <tr style="border-top:1px solid #f0ece4;">
          <td style="color:#9B9B8A;font-size:0.8rem;padding:7px 0;text-transform:uppercase;letter-spacing:0.05em;">Check-out</td>
          <td style="color:#1A1A1A;">${checkOut} <span style="color:#9B9B8A;font-size:0.8rem;">entro le 11:00</span></td>
        </tr>
        <tr style="border-top:1px solid #f0ece4;">
          <td style="color:#9B9B8A;font-size:0.8rem;padding:7px 0;text-transform:uppercase;letter-spacing:0.05em;">Durata</td>
          <td style="color:#1A1A1A;">${nights} nott${nights === 1 ? 'e' : 'i'}</td>
        </tr>
        <tr style="border-top:1px solid #f0ece4;">
          <td style="color:#9B9B8A;font-size:0.8rem;padding:7px 0;text-transform:uppercase;letter-spacing:0.05em;">Totale</td>
          <td style="color:#C4603C;font-weight:700;font-size:1.1rem;">${price}</td>
        </tr>
      </table>
    </div>

    <div style="background:#f0f7f4;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
      <p style="color:#2D4A3E;margin:0 0 6px;font-weight:700;font-size:0.9rem;">📍 Come trovarci</p>
      <p style="color:#6B6B5A;margin:0;font-size:0.85rem;line-height:1.6;">
        Le Limonaie in Centro — Via Mazzocchi 7, San Benedetto del Tronto<br>
        Country House — C.da Santa Lucia 28, San Benedetto del Tronto
      </p>
    </div>

    <p style="color:#6B6B5A;font-size:0.9rem;margin:0;text-align:center;">
      Per qualsiasi info:<br>
      <a href="tel:+393395966527" style="color:#2D4A3E;font-weight:600;">📞 +39 339 59 66 527</a>
      &nbsp;·&nbsp;
      <a href="mailto:info@lelimonaieamare.it" style="color:#2D4A3E;">info@lelimonaieamare.it</a>
    </p>
  </div>

  <div style="background:#1A1A1A;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
    <p style="color:rgba(253,248,240,0.35);margin:0;font-size:0.75rem;">
      Le Limonaie · San Benedetto del Tronto (AP) · Italia
    </p>
  </div>
</div>
</body>
</html>`
}

export function guestCancelEmail({
  guestName,
  roomName,
  checkIn,
  checkOut,
}: {
  guestName: string
  roomName: string
  checkIn: string
  checkOut: string
}): string {
  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:20px;background:#F5F4F0;font-family:Georgia,serif;">
<div style="max-width:580px;margin:0 auto;">

  <div style="background:#2D4A3E;border-radius:16px 16px 0 0;padding:32px;text-align:center;">
    <div style="font-size:2.5rem;margin-bottom:8px;">🍋</div>
    <h1 style="color:#FDF8F0;margin:0 0 6px;font-size:1.6rem;">Le Limonaie</h1>
  </div>

  <div style="background:#FDF8F0;padding:32px;border-left:1px solid #e8e4dc;border-right:1px solid #e8e4dc;">
    <p style="color:#1A1A1A;margin:0 0 16px;font-size:1rem;">Ciao <strong>${guestName}</strong>,</p>
    <p style="color:#6B6B5A;margin:0 0 24px;line-height:1.7;">
      Siamo spiacenti di comunicarti che la prenotazione per <strong>${roomName}</strong>
      dal <strong>${checkIn}</strong> al <strong>${checkOut}</strong>
      non è purtroppo disponibile.
    </p>
    <p style="color:#6B6B5A;margin:0 0 24px;line-height:1.7;">
      Ti invitiamo a contattarci per trovare una soluzione alternativa o per verificare altre date disponibili.
    </p>
    <p style="color:#6B6B5A;font-size:0.9rem;margin:0;text-align:center;">
      <a href="tel:+393395966527" style="color:#2D4A3E;font-weight:600;">📞 +39 339 59 66 527</a>
      &nbsp;·&nbsp;
      <a href="mailto:info@lelimonaieamare.it" style="color:#2D4A3E;">info@lelimonaieamare.it</a>
    </p>
  </div>

  <div style="background:#1A1A1A;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
    <p style="color:rgba(253,248,240,0.35);margin:0;font-size:0.75rem;">
      Le Limonaie · San Benedetto del Tronto (AP) · Italia
    </p>
  </div>
</div>
</body>
</html>`
}
