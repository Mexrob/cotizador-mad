
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

        const { searchParams } = new URL(request.url);
        const lineId = searchParams.get('lineId');

        const where = lineId ? { lineId } : {};

        const tones = await prisma.productTone.findMany({
            where,
            orderBy: [
                { lineId: 'asc' },
                { sortOrder: 'asc' }
            ],
            include: {
                line: {
                    select: { name: true }
                }
            }
        });

        return NextResponse.json({ success: true, data: tones });
    } catch (error) {
        console.error('Error fetching tones:', error);
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

        if (!name || !lineId) {
            return NextResponse.json({ error: 'Nombre y LineId son requeridos' }, { status: 400 });
        }

        const tone = await prisma.productTone.create({
            data: {
                name,
                lineId,
                description: description || null,
                imageUrl: imageUrl || null,
                hexColor: hexColor || null,
                supportsTwoCars: supportsTwoCars ?? false,
                supportsHorizontalGrain: supportsHorizontalGrain ?? false,
                supportsVerticalGrain: supportsVerticalGrain ?? false,
                priceAdjustment: priceAdjustment === '' ? 0 : (priceAdjustment ?? 0),
                twoCarsAdjustment: twoCarsAdjustment === '' ? 0 : (twoCarsAdjustment ?? 0),
                isActive: isActive ?? true,
                sortOrder: sortOrder ?? 0,
            }
        });

        return NextResponse.json({ success: true, data: tone }, { status: 201 });
    } catch (error) {
        console.error('Error creating tone:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
