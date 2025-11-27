
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ModeToggle } from '@/components/mode-toggle'
import {
  Menu,
  X,
  User,
  LogOut,
  Settings,
  ShoppingCart,
  Home,
  Package,
  FileText,
  BarChart3
} from 'lucide-react'

export function Header() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [companySettings, setCompanySettings] = useState<{
    companyName: string
    logo?: string
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
              logo: result.data.logo
            })
          }
        }
      } catch (error) {
        console.error('Error loading company settings:', error)
      }
    }

    fetchCompanySettings()
  }, [])

  // Función robusta de logout para producción
  const handleLogout = async () => {
    if (isLoggingOut) return

    setIsLoggingOut(true)

    try {
      // Intentar logout con NextAuth
      await signOut({
        redirect: false, // Evitar redirección automática para manejarla manualmente
        callbackUrl: '/'
      })

      // Pequeño delay para asegurar que la sesión se limpie
      await new Promise(resolve => setTimeout(resolve, 100))

      // Redirección más confiable en producción
      try {
        window.location.href = '/'
      } catch (redirectError) {
        console.log('Fallback redirect with router.push')
        router.push('/')
      }

    } catch (error) {
      console.error('Error during logout:', error)

      // Fallback: intentar redirección directa
      try {
        window.location.href = '/'
      } catch (fallbackError) {
        console.error('Fallback redirect failed:', fallbackError)
        router.push('/')
      }
    }

    // Timeout de seguridad para resetear el estado de loading
    setTimeout(() => {
      setIsLoggingOut(false)
    }, 3000)
  }

  // Enlaces base (siempre visibles)
  const baseNavigation = [
    { name: 'Inicio', href: '/', icon: Home },
  ]

  // Enlaces que requieren autenticación
  const authRequiredNavigation = session ? [
    { name: 'Productos', href: '/products', icon: Package },
  ] : []

  // Combinar navegación base con la que requiere autenticación
  const navigation = [...baseNavigation, ...authRequiredNavigation]

  const userNavigation = session ? [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Mis Cotizaciones', href: '/quotes', icon: FileText },
    { name: 'Perfil', href: '/profile', icon: User },
  ] : []

  const adminNavigation = session?.user?.role === 'ADMIN' ? [
    { name: 'Administración', href: '/admin', icon: Settings },
  ] : []

  const allNavigation = [...navigation, ...userNavigation, ...adminNavigation]

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm dark:bg-gray-900/80 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-shrink">
            {companySettings.logo ? (
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={companySettings.logo}
                  alt={`${companySettings.companyName} Logo`}
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-module-black to-module-dark rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
            )}
            <span className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate hidden xs:block">
              {companySettings.companyName}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-module-black transition-colors font-medium"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Theme Toggle */}
          <div className="hidden lg:flex items-center ml-4">
            <ModeToggle />
          </div>

          {/* User Menu / Auth Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {session ? (
              <div className="flex items-center space-x-2 sm:space-x-4">
                {/* Desktop User Menu */}
                <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
                  {userNavigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="text-gray-700 hover:text-module-black transition-colors"
                    >
                      <item.icon className="w-5 h-5" />
                    </Link>
                  ))}

                  {session.user.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      className="text-gray-700 hover:text-module-black transition-colors"
                    >
                      <Settings className="w-5 h-5" />
                    </Link>
                  )}
                </div>

                {/* User Avatar */}
                <div className="flex items-center space-x-2">
                  <Avatar className="w-8 h-8 sm:w-9 sm:h-9">
                    <AvatarImage src="" />
                    <AvatarFallback>
                      {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="hidden md:flex"
                  >
                    <LogOut className="w-4 h-4" />
                    {isLoggingOut && <span className="ml-2 text-xs">Cerrando...</span>}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-4">
                <Link href="/auth/signin">
                  <Button variant="ghost">Iniciar Sesión</Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800"
          >
            <div className="px-4 py-3 space-y-1">
              {allNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm sm:text-base">{item.name}</span>
                </Link>
              ))}

              {session ? (
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  disabled={isLoggingOut}
                  onClick={() => {
                    handleLogout()
                    setIsMobileMenuOpen(false)
                  }}
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}
                </Button>
              ) : (
                <div className="space-y-2 pt-2 border-t border-gray-200">
                  <Link href="/auth/signin" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      Iniciar Sesión
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
