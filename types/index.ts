export interface CartItem {
  id: number
  name: string
  price: number   // valor em reais (ex: 129.90)
  quantity: number
  image?: string
  emoji?: string
  category?: string
}

export interface PersonalData {
  firstName: string
  lastName: string
  email: string
  cpf: string
  phone: string
}

export interface AddressData {
  zipCode: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
}

export type PaymentMethod = 'pix' | 'credit_card'

// Token gerado pelo MercadoPago.js no frontend — nunca enviamos número raw
export interface CardData {
  cardToken: string
  installments: number
  paymentMethodId: string   // ex: 'visa', 'master'
  issuerId: string
}

export interface CheckoutFormData {
  personal: PersonalData
  address: AddressData
  paymentMethod: PaymentMethod
  card?: CardData
}

// ─── API responses ────────────────────────────────────────

export interface PixInfo {
  orderId: string
  qrCode: string        // base64 PNG
  qrCodeText: string    // copia-e-cola
  expiresAt: string
}

export interface CheckoutResult {
  success: boolean
  method: PaymentMethod
  pix?: PixInfo
  orderId?: string
  errorMessage?: string
}

export type CheckoutStep = 'personal' | 'address' | 'payment' | 'pix-pending' | 'success' | 'error'

export interface ViaCepResponse {
  logradouro: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}
