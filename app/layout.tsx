
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Module al Dente - Cotizador de Cocinas y Closets',
  description: 'Sistema de cotización para muebles de cocina, baños y closets a la medida. Fabricantes en Guadalajara con materiales de primera calidad.',
  keywords: 'module al dente, cocinas, closets, muebles a medida, Guadalajara, Zapopan, cotizador, carpintería',
  authors: [{ name: 'Module al Dente' }],
  creator: 'Module al Dente',
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    url: 'https://module.com.mx',
    title: 'Module al Dente - Cotizador',
    description: 'Sistema de cotización para muebles de cocina, baños y closets a la medida',
    siteName: 'Module al Dente',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Module al Dente - Cotizador',
    description: 'Sistema de cotización para muebles de cocina, baños y closets a la medida',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <div className="min-h-screen bg-background text-foreground">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
