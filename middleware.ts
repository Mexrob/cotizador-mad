
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

const DEMO_EMAIL = 'demo@module.com.mx'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token;

    // Handle Demo User Read-Only restrictions (identified by email)
    if (token?.email === DEMO_EMAIL) {
      const isMutation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)
      // Allow only safe methods for demo users
      if (isMutation) {
        // Allow log out
        if (pathname === '/api/auth/signout') {
          return NextResponse.next()
        }
        
        return new NextResponse(
          JSON.stringify({ 
            error: 'Modo Demo Activo', 
            message: 'No tienes permisos para realizar cambios en los datos en el modo de demostración.' 
          }),
          { 
            status: 403, 
            headers: { 'content-type': 'application/json' } 
          }
        )
      }
    }

    // Handle root path redirection
    if (pathname === '/') {
      if (!token) {
        // Redirect unauthenticated users to sign in
        return NextResponse.redirect(new URL('/auth/signin', req.url))
      } else {
        // Redirect authenticated users to dashboard
        return NextResponse.redirect(new URL('/quotes', req.url))
      }
    }

    // Additional middleware logic can be added here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl


        // Public routes (very limited now)
        const publicRoutes = [
          '/auth/signin',
          '/api/auth',
        ]

        // Allow access to root path for redirection logic
        if (pathname === '/') {
          return true
        }

        // Check if the route is public
        if (publicRoutes.some(route => pathname.startsWith(route))) {
          return true
        }

        // Admin routes
        const adminRoutes = ['/admin']
        if (adminRoutes.some(route => pathname.startsWith(route))) {
          const isAdmin = token?.role === 'ADMIN';
          return isAdmin;
        }

        // Protected routes require authentication
        const isAuthenticated = !!token;
        return isAuthenticated;
      },
    },
  }
)

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/admin/:path*',
    '/quotes/:path*',
    '/profile/:path*',
    // '/configurator/:path*', // Ruta eliminada
    '/products/:path*',
  ],
}
