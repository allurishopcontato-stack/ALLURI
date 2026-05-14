'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import clsx from 'clsx'
import { maskCard } from '@/lib/utils'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import type { CardData, PaymentMethod } from '@/types'

// Dados visuais do cartão (usados apenas para tokenização — não vão ao backend)
interface CardFormValues {
  number: string
  holder: string
  expiryMonth: string
  expiryYear: string
  cvv: string
  installments: number
}

const cardSchema = z.object({
  number:       z.string().min(19, 'Número do cartão inválido.'),
  holder:       z.string().min(3, 'Nome no cartão obrigatório.'),
  expiryMonth:  z.string().length(2, 'Mês inválido (MM).'),
  expiryYear:   z.string().length(4, 'Ano inválido (AAAA).'),
  cvv:          z.string().min(3, 'CVV inválido.').max(4),
  installments: z.number().min(1).max(12),
})

interface Props {
  onSubmit: (method: PaymentMethod, card?: CardData) => void
  onBack: () => void
  loading: boolean
  total: number
  cpf?: string  // necessário para tokenização pelo Mercado Pago
}

const INSTALLMENTS = [1, 2, 3, 4, 6, 8, 10, 12]

declare global {
  interface Window {
    MercadoPago: new (key: string, opts?: object) => MercadoPagoInstance
  }
}
interface MercadoPagoInstance {
  createCardToken: (data: Record<string, string>) => Promise<{ id: string }>
  getPaymentMethods: (data: { bin: string }) => Promise<{ results: Array<{ id: string; issuer: { id: number } }> }>
}

export default function PaymentStep({ onSubmit, onBack, loading, total, cpf }: Props) {
  const [method, setMethod]             = useState<PaymentMethod>('pix')
  const [tokenizing, setTokenizing]     = useState(false)
  const [tokenError, setTokenError]     = useState('')
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const [issuerId, setIssuerId]         = useState('')
  const mpRef = useRef<MercadoPagoInstance | null>(null)

  // Inicializa o SDK assim que o script estiver carregado
  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY
    if (!publicKey) return

    const init = () => {
      if (typeof window !== 'undefined' && window.MercadoPago) {
        mpRef.current = new window.MercadoPago(publicKey, { locale: 'pt-BR' })
      } else {
        setTimeout(init, 300)
      }
    }
    init()
  }, [])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CardFormValues>({
    resolver: zodResolver(cardSchema),
    defaultValues: { installments: 1 },
  })

  const cardNumber = watch('number')

  // Identifica a bandeira automaticamente pelo BIN (primeiros 6 dígitos)
  useEffect(() => {
    const bin = (cardNumber ?? '').replace(/\s/g, '').slice(0, 6)
    if (bin.length < 6 || !mpRef.current) return

    mpRef.current.getPaymentMethods({ bin })
      .then((data) => {
        const pm = data?.results?.[0]
        if (pm) {
          setPaymentMethodId(pm.id)
          setIssuerId(pm.issuer?.id?.toString() ?? '')
        }
      })
      .catch(() => { /* silencioso — não bloqueia o fluxo */ })
  }, [cardNumber])

  async function handleCardSubmit(values: CardFormValues) {
    if (!mpRef.current) {
      setTokenError('SDK do Mercado Pago não carregado. Recarregue a página.')
      return
    }

    setTokenizing(true)
    setTokenError('')

    try {
      const cardData = {
        cardNumber:           values.number.replace(/\s/g, ''),
        cardholderName:       values.holder,
        cardExpirationMonth:  values.expiryMonth,
        cardExpirationYear:   values.expiryYear,
        securityCode:         values.cvv,
        identificationType:   'CPF',
        identificationNumber: (cpf ?? '').replace(/\D/g, ''),
      }

      console.log('[MP tokenize]', { ...cardData, cardNumber: '****', securityCode: '***' })

      const tokenRes = await mpRef.current.createCardToken(cardData)

      console.log('[MP token]', tokenRes.id)

      onSubmit('credit_card', {
        cardToken:       tokenRes.id,
        installments:    values.installments,
        paymentMethodId: paymentMethodId || 'master',
        issuerId:        issuerId,
      })
    } catch (err: unknown) {
      console.error('[MP createCardToken error]', err)

      // MP.js retorna erros como { cause: [{ code, description }] }
      let msg = 'Dados do cartão inválidos. Verifique e tente novamente.'
      if (err && typeof err === 'object') {
        const mpErr = err as Record<string, unknown>
        const cause = mpErr.cause as Array<{ code: string; description: string }> | undefined
        if (cause?.[0]?.description) {
          msg = cause[0].description
        } else if (typeof mpErr.message === 'string' && mpErr.message) {
          msg = mpErr.message
        }
      }
      setTokenError(msg)
    } finally {
      setTokenizing(false)
    }
  }

  const isLoading = loading || tokenizing

  const installmentPrice = (n: number) =>
    (total / n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div>
      <h2
        className="font-serif text-2xl font-light text-dark mb-1"
        style={{ fontFamily: 'Cormorant Garamond, serif' }}
      >
        Pagamento
      </h2>
      <p className="text-[0.78rem] text-alluri-muted mb-6">Escolha como prefere pagar.</p>

      {/* Seletor de método */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {(['pix', 'credit_card'] as PaymentMethod[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMethod(m); setTokenError('') }}
            className={clsx(
              'flex flex-col items-center gap-2 p-4 border text-center transition-all',
              method === m
                ? 'border-gold bg-rose-light text-dark'
                : 'border-alluri-border bg-white text-alluri-muted hover:border-rose-alluri',
            )}
          >
            <span className="text-2xl">{m === 'pix' ? '🔵' : '💳'}</span>
            <span className="text-[0.72rem] tracking-[0.14em] uppercase font-medium">
              {m === 'pix' ? 'PIX' : 'Cartão de Crédito'}
            </span>
            <span className="text-[0.62rem]">
              {m === 'pix'
                ? <span className="text-emerald-600 font-medium">Aprovação imediata</span>
                : <span className="text-alluri-muted">Até 12x sem juros</span>}
            </span>
          </button>
        ))}
      </div>

      {/* Instruções PIX */}
      {method === 'pix' && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 mb-6 text-[0.8rem] text-emerald-800 leading-relaxed">
          <p className="font-medium mb-1">Como funciona:</p>
          <ol className="list-decimal list-inside space-y-1 text-[0.75rem]">
            <li>Clique em "Gerar QR Code PIX"</li>
            <li>Abra o app do seu banco e escaneie o código</li>
            <li>Ou use o código "copia e cola"</li>
            <li>Confirmação instantânea ✓</li>
          </ol>
        </div>
      )}

      {/* Erro de tokenização */}
      {tokenError && (
        <div className="mb-4 bg-red-50 border border-red-200 px-4 py-3 text-[0.76rem] text-red-700 flex gap-2">
          <span>⚠️</span>
          <span>{tokenError}</span>
        </div>
      )}

      {/* Formulário de cartão */}
      {method === 'credit_card' && (
        <form
          id="card-form"
          onSubmit={handleSubmit(handleCardSubmit)}
          noValidate
          className="space-y-4 mb-6"
        >
          <Input
            label="Número do cartão"
            placeholder="0000 0000 0000 0000"
            maxLength={19}
            required
            error={errors.number?.message}
            {...register('number', {
              onChange: (e) => setValue('number', maskCard(e.target.value)),
            })}
          />
          <Input
            label="Nome impresso no cartão"
            placeholder="Ex: ANA P SILVA"
            required
            error={errors.holder?.message}
            {...register('holder', {
              onChange: (e) => setValue('holder', e.target.value.toUpperCase()),
            })}
          />
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Mês (MM)"
              placeholder="01"
              maxLength={2}
              required
              error={errors.expiryMonth?.message}
              {...register('expiryMonth')}
            />
            <Input
              label="Ano (AAAA)"
              placeholder="2027"
              maxLength={4}
              required
              error={errors.expiryYear?.message}
              {...register('expiryYear')}
            />
            <Input
              label="CVV"
              placeholder="123"
              maxLength={4}
              required
              error={errors.cvv?.message}
              {...register('cvv')}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[0.65rem] tracking-[0.18em] uppercase text-alluri-muted font-medium">
              Parcelas *
            </label>
            <select
              className="w-full px-3 py-2.5 bg-white border border-alluri-border text-sm text-dark outline-none focus:border-gold transition-colors"
              {...register('installments', { valueAsNumber: true })}
            >
              {INSTALLMENTS.map((n) => (
                <option key={n} value={n}>
                  {n}x de {installmentPrice(n)}{n === 1 ? ' à vista' : ' sem juros'}
                </option>
              ))}
            </select>
          </div>
        </form>
      )}

      {/* Ações */}
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} disabled={isLoading}>
          ← Voltar
        </Button>

        {method === 'pix' ? (
          <Button
            type="button"
            variant="primary"
            fullWidth
            loading={isLoading}
            onClick={() => onSubmit('pix')}
          >
            {isLoading ? 'Gerando PIX…' : 'Gerar QR Code PIX →'}
          </Button>
        ) : (
          <Button
            type="submit"
            form="card-form"
            variant="primary"
            fullWidth
            loading={isLoading}
          >
            {tokenizing ? 'Processando cartão…' : isLoading ? 'Aguardando…' : 'Finalizar Pedido →'}
          </Button>
        )}
      </div>

      <p className="text-[0.65rem] text-alluri-muted text-center mt-3">
        🔒 Dados do cartão protegidos pelo Mercado Pago — nunca armazenamos seu número
      </p>
    </div>
  )
}
