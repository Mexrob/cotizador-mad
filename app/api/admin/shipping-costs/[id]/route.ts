
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { adminAuthGuard } from '@/lib/authUtils';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const authGuardResponse = adminAuthGuard(session);
    if (authGuardResponse) return authGuardResponse;

    const body = await request.json();
    const { zone, description, cost, freeFrom, isActive, sortOrder } = body;

    const shipping = await prisma.shippingCost.update({
      where: { id: params.id },
      data: {
        ...(zone && { zone }),
        ...(description !== undefined && { description }),
        ...(cost !== undefined && { cost: Number(cost) }),
        ...(freeFrom !== undefined && { freeFrom: freeFrom ? Number(freeFrom) : null }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    return NextResponse.json({ success: true, data: shipping });
  } catch (error: any) {
    console.error('Error updating shipping cost:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const authGuardResponse = adminAuthGuard(session);
    if (authGuardResponse) return authGuardResponse;

    await prisma.shippingCost.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting shipping cost:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
