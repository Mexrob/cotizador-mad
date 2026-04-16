
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

    const extras = await prisma.extraService.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ success: true, data: extras });
  } catch (error) {
    console.error('Error fetching extra services:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const authGuardResponse = adminAuthGuard(session);
    if (authGuardResponse) return authGuardResponse;

    const body = await request.json();
    const { name, description, price, isActive, sortOrder } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ error: 'El nombre y precio son requeridos' }, { status: 400 });
    }

    const extra = await prisma.extraService.create({
      data: {
        name,
        description: description || null,
        price: Number(price),
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0,
      },
    });

    return NextResponse.json({ success: true, data: extra }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating extra service:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
