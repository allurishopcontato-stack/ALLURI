import type { CartItem } from '@/types'
import { totalCart } from '@/lib/utils'

const RESEND_KEY  = process.env.RESEND_API_KEY
const FROM_EMAIL  = process.env.EMAIL_FROM ?? 'Alluri <pedidos@alluri.com.br>'
const OWNER_EMAIL = process.env.EMAIL_OWNER ?? 'administrativonexus@gmail.com'

function itemsTable(items: CartItem[]) {
  return items.map(i =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0e8e4;font-family:sans-serif;font-size:13px;color:#4a3535">
        ${i.emoji ?? ''} ${i.name}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0e8e4;text-align:center;font-family:sans-serif;font-size:13px;color:#9a8080">
        ${i.quantity}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0e8e4;text-align:right;font-family:sans-serif;font-size:13px;color:#b8935a;font-weight:600">
        R$ ${(i.price * i.quantity).toFixed(2).replace('.', ',')}
      </td>
    </tr>`
  ).join('')
}

function buildCustomerEmail(
  name: string,
  orderId: string,
  items: CartItem[],
  paymentMethod: string,
) {
  const total = totalCart(items).toFixed(2).replace('.', ',')
  const method = paymentMethod === 'pix' ? 'PIX' : 'Cartão de Crédito'

  return `<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0;padding:0;background:#fdf8f5;font-family:sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#fff;border:1px solid #e8d8d0">
    <div style="background:#2a1f1f;padding:28px 32px;text-align:center">
      <h1 style="margin:0;color:#fdfaf8;font-size:22px;letter-spacing:6px;font-weight:300">ALLURI</h1>
    </div>
    <div style="padding:32px">
      <h2 style="margin:0 0 8px;color:#2a1f1f;font-size:20px;font-weight:400">Pedido confirmado! 🎉</h2>
      <p style="margin:0 0 24px;color:#9a8080;font-size:14px">Olá, ${name}! Seu pedido foi recebido com sucesso.</p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
        <thead>
          <tr style="background:#fdf8f5">
            <th style="padding:10px 12px;text-align:left;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#9a8080;font-weight:500">Produto</th>
            <th style="padding:10px 12px;text-align:center;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#9a8080;font-weight:500">Qtd</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#9a8080;font-weight:500">Valor</th>
          </tr>
        </thead>
        <tbody>${itemsTable(items)}</tbody>
      </table>

      <div style="border-top:2px solid #e8d8d0;padding-top:16px;display:flex;justify-content:space-between">
        <span style="font-size:13px;color:#9a8080">Total pago</span>
        <span style="font-size:18px;color:#b8935a;font-weight:600">R$ ${total}</span>
      </div>
      <div style="margin-top:8px">
        <span style="font-size:12px;color:#9a8080">Pagamento: ${method}</span>
      </div>

      <div style="margin-top:28px;background:#fdf8f5;border-left:3px solid #b8935a;padding:14px 16px;font-size:13px;color:#4a3535">
        Seu pedido está sendo preparado com carinho. Em breve você receberá informações sobre a entrega.
      </div>
    </div>
    <div style="background:#2a1f1f;padding:16px;text-align:center">
      <p style="margin:0;color:#9a8080;font-size:11px;letter-spacing:1px">© 2026 Alluri · Pedido #${orderId}</p>
    </div>
  </div>
</body>
</html>`
}

function buildOwnerEmail(
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  orderId: string,
  items: CartItem[],
  paymentMethod: string,
  addressData: Record<string, string> | null,
) {
  const total = totalCart(items).toFixed(2).replace('.', ',')
  const method = paymentMethod === 'pix' ? 'PIX' : 'Cartão de Crédito'
  const itemsList = items.map(i => `• ${i.name} x${i.quantity} — R$ ${(i.price * i.quantity).toFixed(2).replace('.', ',')}`).join('\n')

  const addressLines = addressData ? [
    `${addressData.street ?? ''}, ${addressData.number ?? ''}${addressData.complement ? ` — ${addressData.complement}` : ''}`,
    `${addressData.neighborhood ?? ''} — ${addressData.city ?? ''}/${addressData.state ?? ''}`,
    `CEP: ${addressData.zipCode ?? ''}`,
  ].filter(Boolean).join('<br>') : '-'

  return `<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0;padding:0;background:#0d1117;font-family:sans-serif">
  <div style="max-width:520px;margin:40px auto;background:#161b22;border:1px solid #30363d;padding:28px">
    <h2 style="margin:0 0 4px;color:#f0d9c8;font-size:18px;font-weight:400">🛍️ Novo pedido recebido!</h2>
    <p style="margin:0 0 20px;color:#8b949e;font-size:13px">Pedido #${orderId} — ${method}</p>

    <p style="margin:0 0 8px;color:#6e7681;font-size:11px;letter-spacing:2px;text-transform:uppercase">Cliente</p>
    <div style="background:#0d1117;border:1px solid #21262d;padding:16px;margin-bottom:16px">
      <p style="margin:0 0 6px;color:#f0d9c8;font-size:14px;font-weight:500">${customerName}</p>
      <p style="margin:0 0 4px;color:#8b949e;font-size:13px">📧 ${customerEmail}</p>
      <p style="margin:0;color:#8b949e;font-size:13px">📱 ${customerPhone || '-'}</p>
    </div>

    <p style="margin:0 0 8px;color:#6e7681;font-size:11px;letter-spacing:2px;text-transform:uppercase">Endereço de entrega</p>
    <div style="background:#0d1117;border:1px solid #21262d;padding:16px;margin-bottom:16px">
      <p style="margin:0;color:#8b949e;font-size:13px;line-height:1.8">${addressLines}</p>
    </div>

    <p style="margin:0 0 8px;color:#6e7681;font-size:11px;letter-spacing:2px;text-transform:uppercase">Itens</p>
    <div style="background:#0d1117;border:1px solid #21262d;padding:16px;margin-bottom:16px">
      <pre style="margin:0;color:#c9d1d9;font-size:13px;white-space:pre-wrap;line-height:1.8">${itemsList}</pre>
    </div>

    <div style="border-top:1px solid #30363d;padding-top:14px;text-align:right">
      <span style="color:#b8935a;font-size:20px;font-weight:600">R$ ${total}</span>
    </div>
  </div>
</body>
</html>`
}

export async function sendOrderConfirmationEmails(params: {
  orderId: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  items: CartItem[]
  paymentMethod: string
  addressData?: Record<string, string> | null
}) {
  if (!RESEND_KEY) {
    console.warn('[email] RESEND_API_KEY não configurada — email não enviado')
    return
  }

  const { orderId, customerName, customerEmail, customerPhone = '', items, paymentMethod, addressData = null } = params

  const send = async (to: string[], subject: string, html: string) => {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
      })
      if (!res.ok) console.error('[email send error]', await res.text())
    } catch (e) {
      console.error('[email]', e)
    }
  }

  await Promise.all([
    send(
      [customerEmail],
      'Pedido confirmado — Alluri ✓',
      buildCustomerEmail(customerName, orderId, items, paymentMethod),
    ),
    send(
      [OWNER_EMAIL],
      `Novo pedido #${orderId} — R$ ${totalCart(items).toFixed(2).replace('.', ',')}`,
      buildOwnerEmail(customerName, customerEmail, customerPhone, orderId, items, paymentMethod, addressData),
    ),
  ])
}
