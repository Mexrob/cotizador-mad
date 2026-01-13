
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

        const handle = await (prisma as any).handleModel.update({
            where: { id: params.id },
            data: {
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
                sortOrder,
            }
        });

        return NextResponse.json({ success: true, data: handle });
    } catch (error) {
        console.error('Error updating handle:', error);
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
        const handleWithProducts = await (prisma as any).handleModel.findUnique({
            where: { id: params.id },
            include: {
                _count: {
                    select: { products: true }
                }
            }
        });

        if (handleWithProducts && handleWithProducts._count.products > 0) {
            return NextResponse.json({
                error: 'No se puede eliminar una jaladera que tiene productos asociados.'
            }, { status: 400 });
        }

        await (prisma as any).handleModel.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ success: true, message: 'Jaladera eliminada exitosamente' });
    } catch (error) {
        console.error('Error deleting handle:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
