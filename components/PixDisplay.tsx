'use client'

import { useEffect, useState, useCallback } from 'react'
import type { PixInfo } from '@/types'
import Button from './ui/Button'

interface Props {
  pix: PixInfo
  orderId: string
  onPaid: () => void
}

const POLL_INTERVAL = 5000  // 5 segundos

export default function PixDisplay({ pix, orderId, onPaid }: Props) {
  const [copied, setCopied]       = useState(false)
  const [status, setStatus]       = useState<'pending' | 'paid' | 'expired'>('pending')
  const [timeLeft, setTimeLeft]   = useState<number | null>(null)

  // Countdown até expirar
  useEffect(() => {
    if (!pix.expiresAt) return
    const expires = new Date(pix.expiresAt).getTime()

    const tick = () => {
      const diff = Math.max(0, Math.floor((expires - Date.now()) / 1000))
      setTimeLeft(diff)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [pix.expiresAt])

  // Polling de status
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/pix-status/${orderId}`)
      const { status: s } = await res.json()
      setStatus(s)
      if (s === 'paid') onPaid()
    } catch { /* silencioso */ }
  }, [orderId, onPaid])

  useEffect(() => {
    const id = setInterval(checkStatus, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [checkStatus])

  async function copyCode() {
    await navigator.clipboard.writeText(pix.qrCodeText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  if (status === 'paid') {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">✅</div>
        <h2
          className="font-serif text-2xl text-dark mb-2"
          style={{ fontFamily: 'Cormorant Garamond, serif' }}
        >
          Pagamento confirmado!
        </h2>
        <p className="text-[0.8rem] text-alluri-muted">
          Seu pedido foi recebido. Você receberá um e-mail de confirmação em breve.
        </p>
      </div>
    )
  }

  if (status === 'expired') {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">⏰</div>
        <h2
          className="font-serif text-2xl text-dark mb-2"
          style={{ fontFamily: 'Cormorant Garamond, serif' }}
        >
          PIX expirado
        </h2>
        <p className="text-[0.8rem] text-alluri-muted mb-4">
          O tempo para pagamento expirou. Reinicie o checkout para gerar um novo código.
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div>
      <h2
        className="font-serif text-2xl font-light text-dark mb-1"
        style={{ fontFamily: 'Cormorant Garamond, serif' }}
      >
        Pague com PIX
      </h2>
      <p className="text-[0.78rem] text-alluri-muted mb-6">
        Escaneie o QR Code ou copie o código abaixo para pagar.
      </p>

      {/* QR Code */}
      <div className="flex flex-col items-center gap-4 mb-6">
        <div className="border-4 border-alluri-border p-2 bg-white inline-block">
          {pix.qrCode ? (
            <img
              src={`data:image/png;base64,${pix.qrCode}`}
              alt="QR Code PIX"
              className="w-48 h-48"
            />
          ) : (
            <div className="w-48 h-48 bg-gray-100 flex items-center justify-center text-alluri-muted text-sm">
              QR Code não disponível
            </div>
          )}
        </div>

        {timeLeft !== null && timeLeft > 0 && (
          <div className="flex items-center gap-2 text-[0.75rem] text-alluri-muted">
            <span className="text-amber-500">⏱</span>
            Expira em{' '}
            <span className="font-medium text-dark tabular-nums">
              {formatTime(timeLeft)}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 text-[0.72rem] text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5">
          <span className="animate-pulse">●</span>
          Aguardando pagamento…
        </div>
      </div>

      {/* Copia e cola */}
      {pix.qrCodeText && (
        <div className="mb-6">
          <p className="text-[0.65rem] tracking-[0.16em] uppercase text-alluri-muted mb-2">
            Código copia e cola
          </p>
          <div className="flex gap-2">
            <div className="flex-1 bg-alluri-card border border-alluri-border px-3 py-2.5 text-[0.72rem] text-dark font-mono break-all select-all">
              {pix.qrCodeText}
            </div>
            <button
              onClick={copyCode}
              className="px-4 border border-alluri-border bg-white hover:bg-alluri-card transition-colors text-[0.68rem] tracking-[0.12em] uppercase text-alluri-muted flex-shrink-0"
            >
              {copied ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>
        </div>
      )}

      {/* Instruções */}
      <div className="bg-alluri-card border border-alluri-border p-4 text-[0.75rem] text-alluri-muted leading-relaxed">
        <p className="font-medium text-dark mb-2 text-[0.78rem]">Como pagar:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Abra o app do seu banco</li>
          <li>Vá em "Pagar com PIX" ou "Ler QR Code"</li>
          <li>Escaneie o código acima ou cole o código copia e cola</li>
          <li>Confirme o pagamento</li>
          <li>Esta página atualiza automaticamente ✓</li>
        </ol>
      </div>
    </div>
  )
}
