
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

        const brands = await prisma.brand.findMany({
            orderBy: { sortOrder: 'asc' }
        });

        return NextResponse.json({ success: true, data: brands });
    } catch (error: any) {
        console.error('Error fetching brands:', error);
        return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const authGuardResponse = adminAuthGuard(session);
        if (authGuardResponse) return authGuardResponse;

        const body = await request.json();
        const { name, description, imageUrl, website, status, sortOrder } = body;

        if (!name) {
            return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
        }

        // Check if brand already exists
        const existingBrand = await prisma.brand.findUnique({
            where: { name }
        });

        if (existingBrand) {
            return NextResponse.json({ error: 'Ya existe una marca con ese nombre' }, { status: 400 });
        }

        console.log('Creating brand with data:', { name, description, imageUrl, website, status, sortOrder });

        const brand = await prisma.brand.create({
            data: {
                name,
                description,
                imageUrl,
                website,
                status: status || 'ACTIVE',
                sortOrder: sortOrder ?? 0,
            }
        });

        return NextResponse.json({ success: true, data: brand }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating brand:', error);
        return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
    }
}
