'use client'

import { CartItem } from '@/types'
import { formatPrice, totalCart } from '@/lib/utils'

interface OrderSummaryProps {
  items: CartItem[]
  shipping?: number
}

export default function OrderSummary({ items, shipping = 0 }: OrderSummaryProps) {
  const subtotal = totalCart(items)
  const total = subtotal + shipping

  return (
    <div className="bg-alluri-card border border-alluri-border p-6 sticky top-6">
      {/* Header */}
      <p className="text-[0.62rem] tracking-[0.22em] uppercase text-gold mb-1">Resumo</p>
      <h2
        className="font-serif text-xl font-light text-dark mb-4"
        style={{ fontFamily: 'Cormorant Garamond, serif' }}
      >
        Seu Pedido
      </h2>
      <div className="w-8 h-px bg-gold mb-5" />

      {/* Items */}
      <ul className="space-y-4 mb-5">
        {items.map((item) => (
          <li key={item.id} className="flex gap-3">
            <div className="w-12 h-14 bg-rose-light flex items-center justify-center flex-shrink-0 text-xl">
              {item.image
                ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                : (item.emoji ?? '🛍️')}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-[0.85rem] font-medium text-dark leading-snug"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}
              >
                {item.name}
              </p>
              {item.category && (
                <p className="text-[0.62rem] tracking-[0.12em] uppercase text-alluri-muted mt-0.5">
                  {item.category}
                </p>
              )}
              <p className="text-[0.75rem] text-alluri-muted mt-0.5">
                Qtd: {item.quantity}
              </p>
            </div>
            <p className="text-[0.88rem] text-gold font-medium whitespace-nowrap">
              {formatPrice(item.price * item.quantity)}
            </p>
          </li>
        ))}
      </ul>

      {/* Totals */}
      <div className="border-t border-alluri-border pt-4 space-y-2.5">
        <div className="flex justify-between text-[0.78rem] text-alluri-muted">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-[0.78rem] text-alluri-muted">
          <span>Frete</span>
          <span className="text-emerald-600">{shipping === 0 ? 'Grátis' : formatPrice(shipping)}</span>
        </div>
        <div className="flex justify-between text-[0.92rem] font-medium text-dark pt-2 border-t border-alluri-border">
          <span>Total</span>
          <span className="text-gold">{formatPrice(total)}</span>
        </div>
      </div>

      {/* Badges */}
      <div className="mt-5 space-y-2">
        <div className="flex items-center gap-2 text-[0.68rem] text-alluri-muted">
          <span>🔒</span> Pagamento 100% seguro
        </div>
        <div className="flex items-center gap-2 text-[0.68rem] text-alluri-muted">
          <span>🔄</span> Troca grátis em 30 dias
        </div>
        <div className="flex items-center gap-2 text-[0.68rem] text-alluri-muted">
          <span>📦</span> Frete grátis acima de R$ 199
        </div>
      </div>
    </div>
  )
}
