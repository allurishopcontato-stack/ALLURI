import type { CartItem, PersonalData, AddressData, CardData, PixInfo, CheckoutResult } from '@/types'
import { totalCart } from '@/lib/utils'

const MP_BASE   = 'https://api.mercadopago.com'
const MP_TOKEN  = process.env.MP_ACCESS_TOKEN!

async function mpPost<T>(endpoint: string, body: unknown): Promise<T> {
  const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2)}`

  const res = await fetch(`${MP_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type':       'application/json',
      'Authorization':      `Bearer ${MP_TOKEN}`,
      'X-Idempotency-Key':  idempotencyKey,
    },
    body: JSON.stringify(body),
  })

  const json = await res.json()

  if (!res.ok) {
    console.error('[MP API error]', JSON.stringify(json, null, 2))
    const msg = json?.message ?? json?.error ?? json?.cause?.[0]?.description ?? `HTTP ${res.status}`
    throw new Error(msg)
  }

  return json
}

async function mpGet<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${MP_BASE}${endpoint}`, {
    headers: { 'Authorization': `Bearer ${MP_TOKEN}` },
    cache: 'no-store',
  })

  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

function expiresInOneHour(): string {
  // MP exige formato ISO 8601 com offset explícito (Brasil = -03:00)
  const d = new Date(Date.now() + 3600 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.000-03:00`
}

function cartDescription(items: CartItem[]): string {
  return items.map((i) => `${i.name} x${i.quantity}`).join(', ').slice(0, 255)
}

// ─── PIX ──────────────────────────────────────────────────

export async function createPixOrder(
  items: CartItem[],
  personal: PersonalData,
): Promise<PixInfo> {
  const amount = Math.round(totalCart(items) * 100) / 100

  const data = await mpPost<Record<string, unknown>>('/v1/payments', {
    transaction_amount: amount,
    payment_method_id:  'pix',
    description:        cartDescription(items),
    date_of_expiration: expiresInOneHour(),
    payer: {
      email:      personal.email,
      first_name: personal.firstName,
      last_name:  personal.lastName,
      identification: {
        type:   'CPF',
        number: personal.cpf.replace(/\D/g, ''),
      },
    },
  })

  const txData = (data.point_of_interaction as Record<string, unknown>)
    ?.transaction_data as Record<string, unknown> | undefined

  return {
    orderId:    String(data.id ?? ''),
    qrCode:     String(txData?.qr_code_base64 ?? ''),
    qrCodeText: String(txData?.qr_code ?? ''),
    expiresAt:  String(data.date_of_expiration ?? ''),
  }
}

// ─── Cartão de crédito ────────────────────────────────────

export async function createCardOrder(
  items: CartItem[],
  personal: PersonalData,
  card: CardData,
): Promise<CheckoutResult> {
  const data = await mpPost<Record<string, unknown>>('/v1/payments', {
    transaction_amount: totalCart(items),
    token:              card.cardToken,
    installments:       card.installments,
    payment_method_id:  card.paymentMethodId,
    issuer_id:          card.issuerId,
    description:        cartDescription(items),
    payer: {
      email: personal.email,
      identification: {
        type:   'CPF',
        number: personal.cpf.replace(/\D/g, ''),
      },
    },
  })

  const status = String(data.status ?? '')

  if (status === 'rejected') {
    const detail = String(data.status_detail ?? '')
    throw new Error(mpCardErrorMessage(detail))
  }

  return {
    success: status === 'approved',
    method:  'credit_card',
    orderId: String(data.id ?? ''),
  }
}

// ─── Status PIX ───────────────────────────────────────────

export async function getPixStatus(orderId: string): Promise<'pending' | 'paid' | 'expired'> {
  try {
    const data = await mpGet<Record<string, unknown>>(`/v1/payments/${orderId}`)
    const status = String(data.status ?? '').toLowerCase()

    if (status === 'approved') return 'paid'
    if (['cancelled', 'rejected', 'charged_back', 'refunded'].includes(status)) return 'expired'
    return 'pending'
  } catch {
    return 'pending'
  }
}

// ─── Mensagens de erro do cartão ─────────────────────────

function mpCardErrorMessage(detail: string): string {
  const map: Record<string, string> = {
    cc_rejected_bad_filled_card_number:  'Número do cartão inválido.',
    cc_rejected_bad_filled_date:         'Data de vencimento inválida.',
    cc_rejected_bad_filled_security_code:'CVV inválido.',
    cc_rejected_bad_filled_other:        'Dados do cartão incorretos.',
    cc_rejected_blacklist:               'Cartão não autorizado. Tente outro.',
    cc_rejected_call_for_authorize:      'Autorize a compra pelo app do seu banco e tente novamente.',
    cc_rejected_card_disabled:           'Cartão inativo. Contate seu banco.',
    cc_rejected_duplicated_payment:      'Pagamento duplicado. Aguarde antes de tentar novamente.',
    cc_rejected_high_risk:               'Pagamento recusado por segurança. Tente outro cartão.',
    cc_rejected_insufficient_amount:     'Saldo insuficiente.',
    cc_rejected_invalid_installments:    'Número de parcelas não suportado por este cartão.',
  }
  return map[detail] ?? 'Pagamento não aprovado. Tente outro cartão ou entre em contato com seu banco.'
}
