import { Session } from 'next-auth'
import { NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'

/**
 * Checks if the user in the session has an ADMIN role.
 * If not, returns a 403 Forbidden response.
 * @param session The user session.
 * @returns NextResponse | null - Returns a NextResponse if unauthorized, otherwise null.
 */
export function adminAuthGuard(session: Session | null): NextResponse | null {
  if (!session || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'Acceso denegado. Se requiere rol de Administrador.' }, { status: 403 })
  }
  return null
}