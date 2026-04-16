
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Package, Mail, Phone, MapPin } from 'lucide-react'

export function Footer() {
  const [companySettings, setCompanySettings] = useState<{
    companyName: string
    logo?: string
    phone?: string
    email?: string
    address?: string
    city?: string
    state?: string
    country?: string
  }>({
    companyName: 'Module al Dente', // Fallback
    logo: undefined
  })

  useEffect(() => {
    const fetchCompanySettings = async () => {
      try {
        const response = await fetch('/api/settings/company')
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            setCompanySettings({
              companyName: result.data.companyName,
              logo: result.data.logo,
              phone: result.data.phone,
              email: result.data.email,
              address: result.data.address,
              city: result.data.city,
              state: result.data.state,
              country: result.data.country
            })
          }
        }
      } catch (error) {
        console.error('Error loading company settings:', error)
      }
    }

    fetchCompanySettings()
  }, [])

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              {companySettings.logo ? (
                <div className="relative w-10 h-10 rounded-lg overflow-hidden">
                  <Image
                    src={companySettings.logo}
                    alt={`${companySettings.companyName} Logo`}
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-module-black to-module-dark rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
              )}
              <span className="text-xl font-bold">{companySettings.companyName}</span>
            </div>
            <p className="text-gray-400 text-sm">
              Transformamos espacios en cocinas extraordinarias con muebles de la más alta calidad.
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Plataforma</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/quotes" className="text-gray-400 hover:text-white transition-colors">
                  Cotizaciones
                </Link>
              </li>
              {/* Enlace a Productos eliminado */}
              {/* Enlace a Configurador eliminado */}
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Sistema</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contacto</h3>
            <div className="space-y-2 text-sm text-gray-400">
              {companySettings.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>{companySettings.phone}</span>
                </div>
              )}
              {companySettings.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>{companySettings.email}</span>
                </div>
              )}
              {(companySettings.address || companySettings.city || companySettings.state) && (
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {[
                      companySettings.address,
                      companySettings.city,
                      companySettings.state,
                      companySettings.country
                    ].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2025 {companySettings.companyName}. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
