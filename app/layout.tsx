
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Cocinas de Lujo México - Muebles de Cocina Premium',
  description: 'Transformamos espacios en cocinas extraordinarias con muebles de la más alta calidad. Configurador 3D, cotizaciones instantáneas y diseños personalizados.',
  keywords: 'cocinas de lujo, muebles de cocina, configurador 3D, cotizaciones, México',
  authors: [{ name: 'Cocinas de Lujo México' }],
  creator: 'Cocinas de Lujo México',
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    url: 'https://cocinaslujo.mx',
    title: 'Cocinas de Lujo México',
    description: 'Muebles de cocina premium con configurador 3D y cotizaciones instantáneas',
    siteName: 'Cocinas de Lujo México',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cocinas de Lujo México',
    description: 'Muebles de cocina premium con configurador 3D y cotizaciones instantáneas',
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
          <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
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
