
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { compare } from 'bcryptjs'
import { prisma } from './db'

export const DEMO_EMAIL = 'demo@module.com.mx'

// Function to get session timeout from database
async function getSessionTimeout(): Promise<number> {
  try {
    const settings = await prisma.companySettings.findFirst()
    return settings?.sessionTimeoutMinutes ? settings.sessionTimeoutMinutes * 60 : 15 * 60
  } catch (error) {
    console.error('Error fetching session timeout:', error)
    return 15 * 60 // Default to 15 minutes if error
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 15 * 60, // Default 15 minutes, will be overridden dynamically
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('🔐 [Auth] Attempting login for:', credentials?.email)

        if (!credentials?.email || !credentials?.password) {
          console.log('❌ [Auth] Missing credentials')
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        })

        if (!user) {
          console.log('❌ [Auth] Error: Usuario no encontrado:', credentials.email)
          return null
        }

        console.log('🔍 [Auth] Usuario encontrado:', user.email, 'con rol:', user.role)

        if (!user.password) {
          console.log('❌ [Auth] Error: El usuario no tiene contraseña establecida')
          return null
        }

        const isPasswordValid = await compare(credentials.password, user.password)
        console.log('🔐 [Auth] Resultado de validación de contraseña:', isPasswordValid)

        if (!isPasswordValid) {
          console.log('❌ [Auth] Error de contraseña para:', credentials.email)
          return null
        }

        console.log('✅ [Auth] Login successful for:', user.email)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = user.role
        token.status = user.status
        token.email = user.email
      }

      // Enforce 1 hour session for DEMO users (identified by email)
      const isDemoUser = token.email === DEMO_EMAIL
      if (isDemoUser) {
        if (!token.demo_exp) {
          token.demo_exp = Math.floor(Date.now() / 1000) + (60 * 60)
        }
        token.exp = token.demo_exp
      } else {
        // Set dynamic session expiration for regular users
        const sessionTimeout = await getSessionTimeout()
        token.exp = Math.floor(Date.now() / 1000) + sessionTimeout
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role
        session.user.status = token.status
        // Flag demo user for frontend
        session.user.isDemo = token.email === DEMO_EMAIL
        // Pass expiration time to frontend for the timer
        session.expiresAt = token.exp as number
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
