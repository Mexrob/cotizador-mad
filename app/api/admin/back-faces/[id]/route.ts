
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { adminAuthGuard } from '@/lib/authUtils';

export const dynamic = 'force-dynamic';

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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
            const face = await (prisma as any).productBackFace.update({
                where: { id: params.id },
                data: {
                    name,
                    description,
                    priceAdjustment: Number(priceAdjustment),
                    isTwoSided,
                    isActive,
                    sortOrder,
                }
            });
            return NextResponse.json({ success: true, data: face });
        } catch (dbError: any) {
            console.error('Database error in back-faces PUT:', dbError);
            return NextResponse.json({
                error: 'Error de base de datos al actualizar cara',
                details: dbError.message
            }, { status: 500 });
        }
    } catch (error: any) {
        console.error('Error updating back face:', error);
        return NextResponse.json({ error: 'Error interno del servidor: ' + error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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
            await (prisma as any).productBackFace.delete({
                where: { id: params.id }
            });
            return NextResponse.json({ success: true, message: 'Opción de cara trasera eliminada exitosamente' });
        } catch (dbError: any) {
            console.error('Database error in back-faces DELETE:', dbError);
            return NextResponse.json({
                error: 'Error de base de datos al eliminar cara',
                details: dbError.message
            }, { status: 500 });
        }
    } catch (error: any) {
        console.error('Error deleting back face:', error);
        return NextResponse.json({ error: 'Error interno del servidor: ' + error.message }, { status: 500 });
    }
}
