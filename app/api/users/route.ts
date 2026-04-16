
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { adminAuthGuard } from '@/lib/authUtils'
import { createUserSchema } from '@/lib/validationSchemas'
import { ZodError } from 'zod'

export const dynamic = 'force-dynamic'

// GET - List all users (Admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const authGuardResponse = adminAuthGuard(session)
    if (authGuardResponse) return authGuardResponse

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (role) {
      where.role = role
    }
    
    if (status) {
      where.status = status
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          phone2: true,
          companyName: true,
          taxId: true,
          fiscalRegime: true,
          cfdiUse: true,
          deliveryAddress: true,
          billingAddress: true,
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
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where })
    ])

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Create new user (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const authGuardResponse = adminAuthGuard(session)
    if (authGuardResponse) return authGuardResponse

    const body = await request.json()
    // Validate input using Zod
    let validatedData;
    try {
      validatedData = createUserSchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          { error: 'Error de validación', details: error.errors },
          { status: 400 }
        );
      }
      throw error; // Re-throw if it's not a ZodError
    }

    const {
      name,
      email,
      password,
      phone,
      phone2,
      companyName,
      taxId,
      fiscalRegime,
      cfdiUse,
      deliveryAddress,
      billingAddress,
      country,
      role,
      status,
      discountRate,
      creditLimit,
    } = validatedData; // Use validatedData here

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este email' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create delivery address if provided
    let newDeliveryAddress = null;
    if (deliveryAddress) {
      newDeliveryAddress = await prisma.deliveryAddress.create({
        data: {
          street: deliveryAddress.street,
          exteriorNumber: deliveryAddress.exteriorNumber,
          interiorNumber: deliveryAddress.interiorNumber,
          colony: deliveryAddress.colony,
          zipCode: deliveryAddress.zipCode,
          city: deliveryAddress.city,
          state: deliveryAddress.state,
        }
      });
    }

    // Create billing address if provided
    let newBillingAddress = null;
    if (billingAddress) {
      newBillingAddress = await prisma.billingAddress.create({
        data: {
          street: billingAddress.street,
          number: billingAddress.number,
          colony: billingAddress.colony,
          zipCode: billingAddress.zipCode,
          city: billingAddress.city,
          state: billingAddress.state,
        }
      });
    }

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        phone2,
        companyName,
        taxId,
        fiscalRegime,
        cfdiUse,
        deliveryAddress: newDeliveryAddress ? { connect: { id: newDeliveryAddress.id } } : undefined,
        billingAddress: newBillingAddress ? { connect: { id: newBillingAddress.id } } : undefined,
        country: country || 'Mexico',
        role: role || 'RETAIL',
        status: status || 'ACTIVE',
        discountRate: discountRate || 0,
        creditLimit: creditLimit || 0,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        phone2: true,
        companyName: true,
        taxId: true,
        fiscalRegime: true,
        cfdiUse: true,
        deliveryAddress: true,
        billingAddress: true,
        country: true,
        role: true,
        status: true,
        discountRate: true,
        creditLimit: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

