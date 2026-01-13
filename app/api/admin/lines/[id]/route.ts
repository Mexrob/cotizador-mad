
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
        const { name, description, code, imageUrl, isActive, sortOrder } = body;

        const line = await prisma.productLine.update({
            where: { id: params.id },
            data: {
                name,
                description,
                code,
                imageUrl,
                isActive,
                sortOrder,
            }
        });

        return NextResponse.json({ success: true, data: line });
    } catch (error) {
        console.error('Error updating line:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
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

        // Check if line is used in products
        const lineWithProducts = await prisma.productLine.findUnique({
            where: { id: params.id },
            include: {
                _count: {
                    select: { products: true }
                }
            }
        });

        if (lineWithProducts && lineWithProducts._count.products > 0) {
            return NextResponse.json({
                error: 'No se puede eliminar una línea que tiene productos asociados.'
            }, { status: 400 });
        }

        await prisma.productLine.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ success: true, message: 'Línea eliminada exitosamente' });
    } catch (error) {
        console.error('Error deleting line:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
