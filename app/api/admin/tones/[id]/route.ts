
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
            lineId,
            description,
            imageUrl,
            hexColor,
            supportsTwoCars,
            supportsHorizontalGrain,
            supportsVerticalGrain,
            priceAdjustment,
            twoCarsAdjustment,
            isActive,
            sortOrder
        } = body;

        const tone = await prisma.productTone.update({
            where: { id: params.id },
            data: {
                name,
                lineId,
                description,
                imageUrl,
                hexColor,
                supportsTwoCars,
                supportsHorizontalGrain,
                supportsVerticalGrain,
                priceAdjustment,
                twoCarsAdjustment,
                isActive,
                sortOrder,
            }
        });

        return NextResponse.json({ success: true, data: tone });
    } catch (error) {
        console.error('Error updating tone:', error);
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

        await prisma.productTone.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ success: true, message: 'Tono eliminado exitosamente' });
    } catch (error) {
        console.error('Error deleting tone:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
