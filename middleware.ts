
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token;


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
