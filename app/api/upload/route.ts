import { NextRequest, NextResponse } from 'next/server'

const SB_URL  = process.env.SUPABASE_URL!
const SB_KEY  = process.env.SUPABASE_SERVICE_KEY!
const BUCKET  = 'produtos'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'Nenhum arquivo.' }, { status: 400 })

    const ext  = file.type.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg'
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const bytes = await file.arrayBuffer()

    const res = await fetch(`${SB_URL}/storage/v1/object/${BUCKET}/${path}`, {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${SB_KEY}`,
        'Content-Type': file.type,
        'x-upsert':     'true',
      },
      body: bytes,
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('[upload Supabase]', res.status, errText)
      return NextResponse.json({ error: errText }, { status: 500 })
    }

    const url = `${SB_URL}/storage/v1/object/public/${BUCKET}/${path}`
    return NextResponse.json({ url })
  } catch (err) {
    console.error('[upload]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
