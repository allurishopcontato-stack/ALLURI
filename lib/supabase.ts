const SB_URL = process.env.SUPABASE_URL!
const SB_KEY = process.env.SUPABASE_SERVICE_KEY!

const headers = {
  apikey:        SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  'Content-Type': 'application/json',
  Prefer:        'return=representation',
}

// ─── Tipos ────────────────────────────────────────────────

type ProductRow = {
  id: number; name: string; cat: string; price: string
  old_price: string; badge: string; description: string
  checkout_url: string; img: string; emoji: string; status: string
  variations: Array<{ name: string; options: string[] }> | null
  images: string[] | null
}

export type Product = {
  id: number; name: string; cat: string; price: string
  oldPrice: string; badge: string; desc: string
  checkoutUrl: string; img: string; emoji: string; status: string
  variations?: Array<{ name: string; options: string[] }>
  images?: string[]
}

// ─── Mapeamento DB ↔ App ──────────────────────────────────

function fromRow(r: ProductRow): Product {
  return {
    id: r.id, name: r.name, cat: r.cat, price: r.price,
    oldPrice: r.old_price, badge: r.badge, desc: r.description,
    checkoutUrl: r.checkout_url, img: r.img, emoji: r.emoji, status: r.status,
    variations: r.variations ?? [],
    images: r.images ?? [],
  }
}

function toRow(p: Product): Omit<ProductRow, never> {
  return {
    id: p.id, name: p.name, cat: p.cat, price: p.price,
    old_price: p.oldPrice ?? '', badge: p.badge ?? '',
    description: p.desc ?? '', checkout_url: p.checkoutUrl ?? '',
    img: (p.images?.[0] ?? p.img) ?? '', emoji: p.emoji ?? '🛍️', status: p.status ?? 'active',
    variations: p.variations ?? [],
    images: p.images ?? [],
  }
}

// ─── CRUD ─────────────────────────────────────────────────

export async function dbGetProducts(): Promise<Product[]> {
  const res = await fetch(
    `${SB_URL}/rest/v1/products?select=*&order=created_at.asc`,
    { headers, next: { revalidate: 0 } },
  )
  if (!res.ok) throw new Error(await res.text())
  const rows: ProductRow[] = await res.json()
  return rows.map(fromRow)
}

export async function dbCreateProduct(p: Product): Promise<Product> {
  const res = await fetch(`${SB_URL}/rest/v1/products`, {
    method: 'POST', headers, body: JSON.stringify(toRow(p)),
  })
  if (!res.ok) throw new Error(await res.text())
  const [row]: ProductRow[] = await res.json()
  return fromRow(row)
}

export async function dbUpdateProduct(id: number, p: Product): Promise<Product> {
  const res = await fetch(`${SB_URL}/rest/v1/products?id=eq.${id}`, {
    method: 'PATCH', headers, body: JSON.stringify(toRow(p)),
  })
  if (!res.ok) throw new Error(await res.text())
  const [row]: ProductRow[] = await res.json()
  return fromRow(row)
}

export async function dbDeleteProduct(id: number): Promise<void> {
  const res = await fetch(`${SB_URL}/rest/v1/products?id=eq.${id}`, {
    method: 'DELETE',
    headers: { ...headers, Prefer: 'return=minimal' },
  })
  if (!res.ok) throw new Error(await res.text())
}

// ─── Orders ───────────────────────────────────────────────

export interface OrderInsert {
  mp_id: string
  customer_name: string
  customer_email: string
  customer_cpf?: string
  customer_phone?: string
  city?: string
  state?: string
  address_data?: {
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
  }
  items: unknown
  total: number
  payment_method: string
  status: string
}

export async function dbCreateOrder(order: OrderInsert): Promise<void> {
  const res = await fetch(`${SB_URL}/rest/v1/orders`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify(order),
  })
  if (!res.ok) console.error('[dbCreateOrder]', await res.text())
}

export async function dbUpdateOrderStatus(mpId: string, status: string): Promise<void> {
  const res = await fetch(`${SB_URL}/rest/v1/orders?mp_id=eq.${encodeURIComponent(mpId)}`, {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) console.error('[dbUpdateOrderStatus]', await res.text())
}

export async function dbGetOrders(): Promise<unknown[]> {
  const res = await fetch(
    `${SB_URL}/rest/v1/orders?select=*&order=created_at.desc`,
    { headers, next: { revalidate: 0 } },
  )
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
