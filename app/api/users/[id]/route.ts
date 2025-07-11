
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Users can only access their own profile, unless they're admin
    if (session.user.id !== params.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        companyName: true,
        taxId: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        role: true,
        status: true,
        discountRate: true,
        creditLimit: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            quotes: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Users can only update their own profile, unless they're admin
    if (session.user.id !== params.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      phone,
      companyName,
      taxId,
      address,
      city,
      state,
      zipCode,
      country,
      role,
      status,
      discountRate,
      creditLimit,
      password
    } = body

    // Prepare update data
    const updateData: any = {
      name,
      phone,
      companyName,
      taxId,
      address,
      city,
      state,
      zipCode,
      country,
    }

    // Only admins can update role, status, discount rate, and credit limit
    if (session.user.role === 'ADMIN') {
      if (role !== undefined) updateData.role = role
      if (status !== undefined) updateData.status = status
      if (discountRate !== undefined) updateData.discountRate = discountRate
      if (creditLimit !== undefined) updateData.creditLimit = creditLimit
    }

    // Handle password update
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 12)
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        companyName: true,
        taxId: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        role: true,
        status: true,
        discountRate: true,
        creditLimit: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    // Prevent self-deletion
    if (session.user.id === params.id) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propia cuenta' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            quotes: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Check if user has quotes
    if (user._count.quotes > 0) {
      return NextResponse.json(
        { 
          error: 'No se puede eliminar un usuario que tiene cotizaciones asociadas. Cambia su estado a INACTIVO en su lugar.' 
        },
        { status: 400 }
      )
    }

    // Delete user
    await prisma.user.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Usuario eliminado exitosamente' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
