
import { Loader2 } from 'lucide-react'

export default function HomePage() {
  // This page serves as a redirection point
  // The middleware will handle redirecting users to /auth/signin or /quotes
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">Redirigiendo...</p>
      </div>
    </div>
  )
}
