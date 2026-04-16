
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Toaster } from '@/components/ui/toaster'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

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
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans" suppressHydrationWarning>
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
