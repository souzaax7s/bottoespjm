import type { Metadata, Viewport } from 'next'
import './globals.css'
import { RegisterServiceWorker } from '@/components/pwa/register-service-worker'

export const metadata: Metadata = {
  title: 'BOTÕES PJM',
  description: 'Sistema para controle de produção de botões.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'BOTÕES PJM',
    statusBarStyle: 'default',
  },
  icons: {
    icon: '/icons/pjm-icon.svg',
    apple: '/icons/pjm-icon.svg',
  },
}

export const viewport: Viewport = {
  themeColor: '#B8860B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  )
}