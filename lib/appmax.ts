import type {
  AppmaxPixPayload,
  AppmaxCardPayload,
  CartItem,
  PersonalData,
  AddressData,
  CardData,
  PixInfo,
  CheckoutResult,
} from '@/types'

const BASE_URL = process.env.APPMAX_API_URL!
const ACCESS_TOKEN = process.env.APPMAX_ACCESS_TOKEN!

function toCents(reais: number): number {
  return Math.round(reais * 100)
}

function buildProducts(items: CartItem[]) {
  return items.map((item) => ({
    description: item.name,
    quantity: item.quantity,
    price: toCents(item.price),
  }))
}

function buildCustomer(p: PersonalData) {
  return {
    name: `${p.firstName} ${p.lastName}`,
    email: p.email,
    telephone: p.phone.replace(/\D/g, ''),
    document_number: p.cpf.replace(/\D/g, ''),
  }
}

function buildAddress(a: AddressData) {
  return {
    zip_code: a.zipCode.replace(/\D/g, ''),
    street: a.street,
    street_number: a.number,
    complement: a.complement,
    neighborhood: a.neighborhood,
    city: a.city,
    state: a.state,
  }
}

async function appmaxPost<T>(endpoint: string, body: T) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access-token': ACCESS_TOKEN,
    },
    body: JSON.stringify(body),
  })

  const json = await res.json()

  if (!res.ok) {
    const msg = json?.message ?? json?.error ?? `HTTP ${res.status}`
    throw new Error(msg)
  }

  return json
}

// ─── PIX ──────────────────────────────────────────────────

export async function createPixOrder(
  items: CartItem[],
  personal: PersonalData,
  address: AddressData,
): Promise<PixInfo> {
  const payload: AppmaxPixPayload = {
    access_token: ACCESS_TOKEN,
    products: buildProducts(items),
    customer: buildCustomer(personal),
    billing_address: buildAddress(address),
    payment: {
      method: 'pix',
      pix: {
        document_number: personal.cpf.replace(/\D/g, ''),
        expiration_time: 3600, // 1 hora
      },
    },
  }

  const json = await appmaxPost('/checkout', payload)
  const data = json.data ?? json

  return {
    orderId:    String(data.order_id ?? data.id ?? ''),
    qrCode:     data.pix?.qr_code ?? data.pix_qr_code ?? '',
    qrCodeText: data.pix?.qr_code_text ?? data.pix_key ?? '',
    expiresAt:  data.pix?.expires_at ?? data.expires_at ?? '',
  }
}

// ─── Cartão de crédito ────────────────────────────────────

export async function createCardOrder(
  items: CartItem[],
  personal: PersonalData,
  address: AddressData,
  card: CardData,
): Promise<CheckoutResult> {
  const payload: AppmaxCardPayload = {
    access_token: ACCESS_TOKEN,
    products: buildProducts(items),
    customer: buildCustomer(personal),
    billing_address: buildAddress(address),
    payment: {
      method: 'credit_card',
      credit_card: {
        number:           card.number.replace(/\s/g, ''),
        holder:           card.holder.toUpperCase(),
        expiration_month: card.expiryMonth,
        expiration_year:  card.expiryYear,
        cvv:              card.cvv,
        installments:     card.installments,
        document_number:  personal.cpf.replace(/\D/g, ''),
      },
    },
  }

  const json = await appmaxPost('/checkout', payload)
  const data = json.data ?? json

  return {
    success:  true,
    method:   'credit_card',
    orderId:  String(data.order_id ?? data.id ?? ''),
  }
}

// ─── Status do PIX ───────────────────────────────────────

export async function getPixStatus(orderId: string): Promise<'pending' | 'paid' | 'expired'> {
  const res = await fetch(`${BASE_URL}/pix/${orderId}/status`, {
    headers: { 'access-token': ACCESS_TOKEN },
    cache: 'no-store',
  })

  if (!res.ok) return 'pending'

  const json = await res.json()
  const status = (json.data?.status ?? json.status ?? '').toLowerCase()

  if (status.includes('paid') || status.includes('approved') || status.includes('confirmed')) return 'paid'
  if (status.includes('expir') || status.includes('cancel')) return 'expired'
  return 'pending'
}
