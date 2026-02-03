
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

        const lines = await prisma.productLine.findMany({
            orderBy: { sortOrder: 'asc' },
            include: {
                _count: {
                    select: { products: true, tones: true }
                }
            }
        });

        return NextResponse.json({ success: true, data: lines });
    } catch (error) {
        console.error('Error fetching lines:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const authGuardResponse = adminAuthGuard(session);
        if (authGuardResponse) return authGuardResponse;

        const body = await request.json();
        const { name, description, code, imageUrl, isActive, sortOrder } = body;

        if (!name) {
            return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
        }

        const line = await prisma.productLine.create({
            data: {
                name,
                description: description || null,
                code: code || null,
                imageUrl: imageUrl || null,
                isActive: isActive ?? true,
                sortOrder: sortOrder ?? 0,
            }
        });

        return NextResponse.json({ success: true, data: line }, { status: 201 });
    } catch (error) {
        console.error('Error creating line:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
