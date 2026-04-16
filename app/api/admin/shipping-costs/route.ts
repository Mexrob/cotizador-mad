
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { adminAuthGuard } from '@/lib/authUtils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const authGuardResponse = adminAuthGuard(session);
    if (authGuardResponse) return authGuardResponse;

    const costs = await prisma.shippingCost.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ success: true, data: costs });
  } catch (error) {
    console.error('Error fetching shipping costs:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const authGuardResponse = adminAuthGuard(session);
    if (authGuardResponse) return authGuardResponse;

    const body = await request.json();
    const { zone, description, cost, freeFrom, isActive, sortOrder } = body;

    if (!zone || cost === undefined) {
      return NextResponse.json({ error: 'La zona y costo son requeridos' }, { status: 400 });
    }

    const shipping = await prisma.shippingCost.create({
      data: {
        zone,
        description: description || null,
        cost: Number(cost),
        freeFrom: freeFrom ? Number(freeFrom) : null,
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0,
      },
    });

    return NextResponse.json({ success: true, data: shipping }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating shipping cost:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
