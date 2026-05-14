import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: 'Checkout — Alluri',
  description: 'Finalize seu pedido Alluri com segurança.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <Script
          src="https://sdk.mercadopago.com/js/v2"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
