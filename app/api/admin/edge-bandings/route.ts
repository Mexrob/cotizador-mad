
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

        const edges = await (prisma as any).edgeBanding.findMany({
            orderBy: { sortOrder: 'asc' },
            include: {
                _count: {
                    select: { products: true }
                }
            }
        });

        return NextResponse.json({ success: true, data: edges });
    } catch (error: any) {
        console.error('Error fetching edge bandings:', error);
        return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const authGuardResponse = adminAuthGuard(session);
        if (authGuardResponse) return authGuardResponse;

        const body = await request.json();
        const { name, description, imageUrl, isActive, sortOrder } = body;

        if (!name) {
            return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
        }

        const edge = await (prisma as any).edgeBanding.create({
            data: {
                name,
                description,
                imageUrl,
                isActive: isActive ?? true,
                sortOrder: sortOrder ?? 0,
            }
        });

        return NextResponse.json({ success: true, data: edge }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating edge banding:', error);
        return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
    }
}
