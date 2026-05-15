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
    // Atualiza status no Supabase
    await dbUpdateOrderStatus(mpId, 'approved')

    // Envia email apenas uma vez (busca o pedido para checar se já enviou)
    try {
      const orders = await dbGetOrders() as Array<Record<string, unknown>>
      const order  = orders.find((o) => o.mp_id === mpId)

      if (order && order.status !== 'approved') {
        await sendOrderConfirmationEmails({
          orderId:       mpId,
          customerName:  String(order.customer_name ?? ''),
          customerEmail: String(order.customer_email ?? ''),
          items:         (order.items as never[]) ?? [],
          paymentMethod: 'pix',
          city:          String(order.city ?? ''),
          state:         String(order.state ?? ''),
        })
      }
    } catch (e) {
      console.error('[pix-status email]', e)
    }
  }

  if (status === 'expired') {
    await dbUpdateOrderStatus(mpId, 'cancelled')
  }

  return NextResponse.json({ status })
}
