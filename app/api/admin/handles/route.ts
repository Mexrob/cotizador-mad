
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

        const handles = await (prisma as any).handleModel.findMany({
            orderBy: { sortOrder: 'asc' }
        });

        return NextResponse.json({ success: true, data: handles });
    } catch (error) {
        console.error('Error fetching handles:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const authGuardResponse = adminAuthGuard(session);
        if (authGuardResponse) return authGuardResponse;

        const body = await request.json();
        const {
            name,
            model,
            finish,
            description,
            imageUrl,
            price,
            priceUnit,
            length,
            width,
            isActive,
            sortOrder
        } = body;

        if (!name || price === undefined || price === null || price === '') {
            return NextResponse.json({ error: 'Nombre y precio son requeridos' }, { status: 400 });
        }

        // Check if handle already exists
        const existingHandle = await (prisma as any).handleModel.findUnique({
            where: { name }
        });

        if (existingHandle) {
            return NextResponse.json({ error: 'Ya existe una jaladera con ese nombre' }, { status: 400 });
        }

        const handle = await (prisma as any).handleModel.create({
            data: {
                name,
                model: model || null,
                finish: finish || null,
                description,
                imageUrl,
                price,
                priceUnit: priceUnit ?? 'ml',
                length,
                width,
                isActive: isActive ?? true,
                sortOrder: sortOrder ?? 0,
            }
        });

        return NextResponse.json({ success: true, data: handle }, { status: 201 });
    } catch (error) {
        console.error('Error creating handle:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
