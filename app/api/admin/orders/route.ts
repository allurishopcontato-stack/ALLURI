import { NextResponse } from 'next/server'
import { dbGetOrders } from '@/lib/supabase'

export async function GET() {
  try {
    const orders = await dbGetOrders()
    return NextResponse.json(orders)
  } catch (err) {
    console.error('[GET /api/admin/orders]', err)
    return NextResponse.json([], { status: 500 })
  }
}
