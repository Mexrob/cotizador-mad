
'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Clock, ShieldAlert } from 'lucide-react'

export function DemoAlert() {
  const { data: session } = useSession()
  const [timeLeft, setTimeLeft] = useState<string>('')
  
  const isDemo = session?.user?.isDemo === true

  useEffect(() => {
    if (!isDemo || !session?.expiresAt) return

    const targetDate = session.expiresAt * 1000 // Convert from seconds to ms

    const updateTimer = () => {
      const now = Date.now()
      const difference = targetDate - now

      if (difference <= 0) {
        setTimeLeft('00:00')
        // Automatically sign out when time is up
        signOut({ callbackUrl: '/auth/signin?reason=demo_expired' })
        return
      }

      const minutes = Math.floor(difference / 1000 / 60)
      const seconds = Math.floor((difference / 1000) % 60)

      setTimeLeft(
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      )
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [isDemo, session?.expiresAt])

  return (
    <AnimatePresence>
      {isDemo && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-amber-600 text-white overflow-hidden shadow-md"
        >
          <div className="max-w-7xl mx-auto px-4 py-2 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              <span className="text-sm font-medium">
                <span className="hidden sm:inline">Modo Demostración Activo — </span>
                Solo lectura habilitado
              </span>
            </div>
            
            <div className="flex items-center gap-3 bg-amber-700/50 px-3 py-1 rounded-full border border-amber-500/30">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs font-mono font-bold tracking-wider">
                SESIÓN EXPIRA EN: {timeLeft}
              </span>
            </div>

            <div className="hidden md:flex items-center gap-2 text-[10px] uppercase tracking-widest opacity-80">
              <AlertCircle className="w-3 h-3" />
              Tus cambios no serán guardados
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
