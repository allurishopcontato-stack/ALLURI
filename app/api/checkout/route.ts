import { NextRequest, NextResponse } from 'next/server'
import { createPixOrder, createCardOrder } from '@/lib/mercadopago'
import type { CartItem, PersonalData, AddressData, CardData, PaymentMethod } from '@/types'

export interface CheckoutRequestBody {
  items: CartItem[]
  personal: PersonalData
  address: AddressData
  paymentMethod: PaymentMethod
  card?: CardData
}

export async function POST(req: NextRequest) {
  try {
    const body: CheckoutRequestBody = await req.json()
    const { items, personal, address, paymentMethod, card } = body

    if (!items?.length)    return error('Nenhum item no carrinho.', 400)
    if (!personal?.email)  return error('Dados pessoais inválidos.', 400)
    if (!address?.zipCode) return error('Endereço inválido.', 400)
    if (!paymentMethod)    return error('Método de pagamento não informado.', 400)
    if (paymentMethod === 'credit_card' && !card?.cardToken) {
      return error('Token do cartão inválido.', 400)
    }

    if (paymentMethod === 'pix') {
      const pixInfo = await createPixOrder(items, personal)
      return NextResponse.json({ success: true, method: 'pix', pix: pixInfo })
    }

    if (paymentMethod === 'credit_card') {
      const result = await createCardOrder(items, personal, card!)
      return NextResponse.json(result)
    }

    return error('Método de pagamento não suportado.', 400)
  } catch (err: unknown) {
    console.error('[checkout]', err)
    const message = err instanceof Error ? err.message : 'Erro ao processar pagamento.'
    return error(message, 500)
  }
}

function error(message: string, status: number) {
  return NextResponse.json({ success: false, errorMessage: message }, { status })
}
