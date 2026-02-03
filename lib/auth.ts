
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { compare } from 'bcryptjs'
import { prisma } from './db'

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
          console.log('❌ [Auth] User not found:', credentials.email)
          return null
        }

        if (!user.password) {
          console.log('❌ [Auth] User has no password set')
          return null
        }

        const isPasswordValid = await compare(credentials.password, user.password)
        console.log('🔐 [Auth] Password validation result:', isPasswordValid)

        if (!isPasswordValid) {
          console.log('❌ [Auth] Invalid password')
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
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.status = user.status
      }

      // Set dynamic session expiration
      const sessionTimeout = await getSessionTimeout()
      token.exp = Math.floor(Date.now() / 1000) + sessionTimeout

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role
        session.user.status = token.status
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
