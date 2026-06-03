import { NextRequest, NextResponse } from 'next/server'
import { dbGetProducts, dbCreateProduct } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const products = await dbGetProducts()
    return NextResponse.json(products)
  } catch (err) {
    console.error('[GET /api/products]', err)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const product = await dbCreateProduct(body)
    return NextResponse.json(product)
  } catch (err) {
    console.error('[POST /api/products]', err)
    return NextResponse.json({ error: 'Erro ao criar produto.' }, { status: 500 })
  }
}
