import { NextRequest, NextResponse } from 'next/server'
import { getPixStatus } from '@/lib/mercadopago'

export async function GET(
  _req: NextRequest,
  { params }: { params: { orderId: string } },
) {
  const status = await getPixStatus(params.orderId)
  return NextResponse.json({ status })
}
