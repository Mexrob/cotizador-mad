
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
        const { name, description, imageUrl, isActive, sortOrder } = body;

        const edge = await (prisma as any).edgeBanding.update({
            where: { id: params.id },
            data: {
                name,
                description,
                imageUrl,
                isActive,
                sortOrder,
            }
        });

        return NextResponse.json({ success: true, data: edge });
    } catch (error) {
        console.error('Error updating edge banding:', error);
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

        // Check if used in products
        const edgeWithProducts = await (prisma as any).edgeBanding.findUnique({
            where: { id: params.id },
            include: {
                _count: {
                    select: { products: true }
                }
            }
        });

        if (edgeWithProducts && edgeWithProducts._count.products > 0) {
            return NextResponse.json({
                error: 'No se puede eliminar un cubrecanto que tiene productos asociados.'
            }, { status: 400 });
        }

        await (prisma as any).edgeBanding.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ success: true, message: 'Cubrecanto eliminado exitosamente' });
    } catch (error) {
        console.error('Error deleting edge banding:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
