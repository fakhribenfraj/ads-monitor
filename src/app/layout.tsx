import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/toaster'
import { AppLayout } from '@/components/AppLayout'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ads Notif - Brief Monitor',
  description: 'Monitor new briefs from ConnectContent and receive push notifications',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <AppLayout>
            <main className="min-h-screen bg-gray-50 py-8">
              <div className="container mx-auto px-4">
                {children}
              </div>
            </main>
          </AppLayout>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
