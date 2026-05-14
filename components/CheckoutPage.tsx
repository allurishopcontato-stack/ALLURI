'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import clsx from 'clsx'
import type {
  CartItem,
  PersonalData,
  AddressData,
  CardData,
  PaymentMethod,
  CheckoutResult,
  CheckoutStep,
  PixInfo,
} from '@/types'
import { totalCart, formatPrice } from '@/lib/utils'
import OrderSummary from './OrderSummary'
import PersonalStep from './steps/PersonalStep'
import AddressStep  from './steps/AddressStep'
import PaymentStep  from './steps/PaymentStep'
import PixDisplay   from './PixDisplay'

const DEMO_ITEMS: CartItem[] = [
  { id: 3, name: 'Ear Cuff Aurora', price: 129.90, quantity: 1, emoji: '💎', category: 'Brinco' },
  { id: 5, name: 'Colar Lua Cheia', price: 149.90, quantity: 1, emoji: '📿', category: 'Colar'  },
]

function parseCartParam(raw: string | null): CartItem[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(decodeURIComponent(raw))
    if (!Array.isArray(parsed) || !parsed.length) return []
    return parsed.map((item: Record<string, unknown>) => ({
      id:       Number(item.id)       || 0,
      name:     String(item.name)     || '',
      price:    Number(item.price)    || 0,
      quantity: Number(item.quantity) || 1,
      emoji:    String(item.emoji    ?? '🛍️'),
      category: String(item.category ?? ''),
      image:    item.image ? String(item.image) : undefined,
    }))
  } catch {
    return []
  }
}

const STEPS: { key: CheckoutStep; label: string }[] = [
  { key: 'personal', label: 'Dados' },
  { key: 'address',  label: 'Endereço' },
  { key: 'payment',  label: 'Pagamento' },
]

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const [step, setStep]         = useState<CheckoutStep>('personal')
  const [personal, setPersonal] = useState<PersonalData>()
  const [address, setAddress]   = useState<AddressData>()
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [pixInfo, setPixInfo]   = useState<PixInfo>()
  const [orderId, setOrderId]   = useState('')

  const items = parseCartParam(searchParams.get('cart')) || DEMO_ITEMS
  const total = totalCart(items)

  const currentStepIndex = STEPS.findIndex((s) => s.key === step)

  async function submitPayment(method: PaymentMethod, card?: CardData) {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          personal,
          address,      // mantido para referência/logs; PIX não usa no MP
          paymentMethod: method,
          card,
        }),
      })

      const data: CheckoutResult = await res.json()

      if (!data.success) {
        setError(data.errorMessage ?? 'Erro ao processar pagamento. Tente novamente.')
        return
      }

      if (method === 'pix' && data.pix) {
        setPixInfo(data.pix)
        setOrderId(data.pix.orderId)
        setStep('pix-pending')
        return
      }

      if (method === 'credit_card') {
        setOrderId(data.orderId ?? '')
        setStep('success')
      }
    } catch {
      setError('Falha na conexão. Verifique sua internet e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const isFormStep = currentStepIndex >= 0

  return (
    <div className="min-h-screen bg-alluri-bg">

      {/* Top bar */}
      <header className="bg-alluri-white border-b border-alluri-border px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span
            className="text-2xl font-light tracking-[0.3em] uppercase text-dark"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            ALLURI
          </span>
          <div className="flex items-center gap-1 text-[0.62rem] tracking-[0.1em] text-alluri-muted">
            🔒 Checkout Seguro
          </div>
        </div>
      </header>

      {/* Step indicator */}
      {isFormStep && (
        <div className="bg-alluri-white border-b border-alluri-border px-4 sm:px-6 py-3">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-0">
              {STEPS.map((s, i) => (
                <div key={s.key} className="flex items-center">
                  <div className="flex items-center gap-2">
                    <div
                      className={clsx(
                        'w-6 h-6 rounded-full flex items-center justify-center text-[0.65rem] font-medium',
                        i < currentStepIndex
                          ? 'bg-gold text-white'
                          : i === currentStepIndex
                          ? 'bg-dark text-alluri-white'
                          : 'bg-alluri-border text-alluri-muted',
                      )}
                    >
                      {i < currentStepIndex ? '✓' : i + 1}
                    </div>
                    <span
                      className={clsx(
                        'text-[0.68rem] tracking-[0.12em] uppercase hidden sm:inline',
                        i === currentStepIndex ? 'text-dark font-medium' : 'text-alluri-muted',
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={clsx(
                        'h-px w-8 sm:w-16 mx-2',
                        i < currentStepIndex ? 'bg-gold' : 'bg-alluri-border',
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className={clsx(
          'grid gap-8',
          isFormStep || step === 'pix-pending'
            ? 'grid-cols-1 lg:grid-cols-[1fr_340px]'
            : 'grid-cols-1 max-w-lg mx-auto',
        )}>

          {/* Form / Status area */}
          <div className="bg-alluri-white border border-alluri-border p-6 sm:p-8">

            {/* Error banner */}
            {error && (
              <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 p-4 text-[0.78rem] text-red-700">
                <span className="flex-shrink-0 mt-0.5">⚠️</span>
                <div>
                  <p className="font-medium">Erro no pagamento</p>
                  <p className="mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {step === 'personal' && (
              <PersonalStep
                defaultValues={personal}
                onNext={(data) => { setPersonal(data); setStep('address') }}
              />
            )}

            {step === 'address' && (
              <AddressStep
                defaultValues={address}
                onNext={(data) => { setAddress(data); setStep('payment') }}
                onBack={() => setStep('personal')}
              />
            )}

            {step === 'payment' && (
              <PaymentStep
                total={total}
                loading={loading}
                cpf={personal?.cpf}
                onBack={() => setStep('address')}
                onSubmit={submitPayment}
              />
            )}

            {step === 'pix-pending' && pixInfo && (
              <PixDisplay
                pix={pixInfo}
                orderId={orderId}
                onPaid={() => setStep('success')}
              />
            )}

            {step === 'success' && (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">🎉</div>
                <h2
                  className="font-serif text-2xl text-dark mb-2"
                  style={{ fontFamily: 'Cormorant Garamond, serif' }}
                >
                  Pedido confirmado!
                </h2>
                <p className="text-[0.8rem] text-alluri-muted mb-1">
                  Pedido <strong className="text-dark">#{orderId}</strong> realizado com sucesso.
                </p>
                <p className="text-[0.78rem] text-alluri-muted mb-6">
                  Você receberá um e-mail de confirmação em breve.
                </p>
                <a
                  href="/"
                  className="inline-block px-6 py-3 bg-dark text-alluri-white text-[0.72rem] tracking-[0.2em] uppercase hover:bg-gold transition-colors"
                >
                  Voltar à Loja
                </a>
              </div>
            )}

            {step === 'error' && (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">❌</div>
                <h2
                  className="font-serif text-2xl text-dark mb-2"
                  style={{ fontFamily: 'Cormorant Garamond, serif' }}
                >
                  Pagamento não aprovado
                </h2>
                <p className="text-[0.8rem] text-alluri-muted mb-6">{error}</p>
                <button
                  onClick={() => { setError(''); setStep('payment') }}
                  className="px-6 py-3 border border-dark text-dark text-[0.72rem] tracking-[0.16em] uppercase hover:bg-dark hover:text-alluri-white transition-colors"
                >
                  Tentar novamente
                </button>
              </div>
            )}
          </div>

          {/* Order summary sidebar */}
          {(isFormStep || step === 'pix-pending') && (
            <div>
              <OrderSummary items={items} />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-alluri-border py-5 px-4 text-center text-[0.65rem] text-alluri-muted tracking-[0.08em]">
        © 2025 Alluri · Pagamentos processados com segurança pela Appmax
      </footer>
    </div>
  )
}
