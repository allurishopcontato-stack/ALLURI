import { Suspense } from 'react'
import CheckoutPage from '@/components/CheckoutPage'

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-alluri-bg flex items-center justify-center">
        <div className="text-alluri-muted text-sm tracking-widest uppercase animate-pulse">
          Carregando…
        </div>
      </div>
    }>
      <CheckoutPage />
    </Suspense>
  )
}
