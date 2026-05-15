import { NextRequest, NextResponse } from 'next/server'
import { dbUpdateProduct, dbDeleteProduct } from '@/lib/supabase'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json()
    const product = await dbUpdateProduct(Number(params.id), body)
    return NextResponse.json(product)
  } catch (err) {
    console.error('[PUT /api/products]', err)
    return NextResponse.json({ error: 'Erro ao atualizar produto.' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await dbDeleteProduct(Number(params.id))
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/products]', err)
    return NextResponse.json({ error: 'Erro ao deletar produto.' }, { status: 500 })
  }
}
