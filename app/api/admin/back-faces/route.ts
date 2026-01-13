
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { adminAuthGuard } from '@/lib/authUtils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const authGuardResponse = adminAuthGuard(session);
        if (authGuardResponse) return authGuardResponse;

        if (!(prisma as any).productBackFace) {
            const availableModels = Object.keys(prisma).filter(key => !key.startsWith('_'));
            return NextResponse.json({
                error: 'El modelo ProductBackFace no está disponible en Prisma',
                availableModels
            }, { status: 500 });
        }

        try {
            const faces = await (prisma as any).productBackFace.findMany({
                orderBy: { sortOrder: 'asc' }
            });
            return NextResponse.json({ success: true, data: faces });
        } catch (dbError: any) {
            console.error('Database error in back-faces GET:', dbError);
            return NextResponse.json({
                error: 'Error de base de datos al obtener caras',
                details: dbError.message
            }, { status: 500 });
        }
    } catch (error: any) {
        console.error('Error fetching back faces:', error);
        return NextResponse.json({ error: 'Error interno del servidor: ' + error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const authGuardResponse = adminAuthGuard(session);
        if (authGuardResponse) return authGuardResponse;

        const body = await request.json();
        const { name, description, priceAdjustment, isTwoSided, isActive, sortOrder } = body;

        if (!(prisma as any).productBackFace) {
            const availableModels = Object.keys(prisma).filter(key => !key.startsWith('_'));
            return NextResponse.json({
                error: 'El modelo ProductBackFace no está disponible en Prisma',
                availableModels
            }, { status: 500 });
        }

        try {
            const face = await (prisma as any).productBackFace.create({
                data: {
                    name,
                    description,
                    priceAdjustment: Number(priceAdjustment),
                    isTwoSided: isTwoSided || false,
                    isActive: isActive !== undefined ? isActive : true,
                    sortOrder: sortOrder || 0,
                }
            });
            return NextResponse.json({ success: true, data: face });
        } catch (dbError: any) {
            console.error('Database error in back-faces POST:', dbError);
            return NextResponse.json({
                error: 'Error de base de datos al crear cara',
                details: dbError.message
            }, { status: 500 });
        }
    } catch (error: any) {
        console.error('Error creating back face:', error);
        return NextResponse.json({ error: 'Error interno del servidor: ' + error.message }, { status: 500 });
    }
}
