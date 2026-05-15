import { NextRequest, NextResponse } from 'next/server'
import { getPixStatus } from '@/lib/mercadopago'
import { dbUpdateOrderStatus, dbGetOrders } from '@/lib/supabase'
import { sendOrderConfirmationEmails } from '@/lib/email'

export async function GET(
  _req: NextRequest,
  { params }: { params: { orderId: string } },
) {
  const mpId   = params.orderId
  const status = await getPixStatus(mpId)

  if (status === 'paid') {
    // Busca o pedido ANTES de atualizar para saber se já enviou email
    const orders = await dbGetOrders() as Array<Record<string, unknown>>
    const order  = orders.find((o) => o.mp_id === mpId)
    const jaProcessado = order?.status === 'approved'

    // Atualiza status
    await dbUpdateOrderStatus(mpId, 'approved')

    // Envia email apenas na primeira vez que detecta pagamento
    if (order && !jaProcessado) {
      try {
        await sendOrderConfirmationEmails({
          orderId:       mpId,
          customerName:  String(order.customer_name ?? ''),
          customerEmail: String(order.customer_email ?? ''),
          customerPhone: String(order.customer_phone ?? ''),
          items:         (order.items as never[]) ?? [],
          paymentMethod: 'pix',
          addressData:   (order.address_data as Record<string, string>) ?? null,
        })
      } catch (e) {
        console.error('[pix-status email]', e)
      }
    }
  }

  if (status === 'expired') {
    await dbUpdateOrderStatus(mpId, 'cancelled')
  }

  return NextResponse.json({ status })
}
