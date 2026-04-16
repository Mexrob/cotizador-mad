
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { adminAuthGuard } from '@/lib/authUtils';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        const authGuardResponse = adminAuthGuard(session);
        if (authGuardResponse) return authGuardResponse;

        const brand = await prisma.brand.findUnique({
            where: { id: params.id }
        });

        if (!brand) {
            return NextResponse.json({ error: 'Marca no encontrada' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: brand });
    } catch (error: any) {
        console.error('Error fetching brand:', error);
        return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        const authGuardResponse = adminAuthGuard(session);
        if (authGuardResponse) return authGuardResponse;

        const body = await request.json();
        const { name, description, imageUrl, website, status, sortOrder } = body;

        if (!name) {
            return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
        }

        const existingBrand = await prisma.brand.findUnique({
            where: { id: params.id }
        });

        if (!existingBrand) {
            return NextResponse.json({ error: 'Marca no encontrada' }, { status: 404 });
        }

        const brand = await prisma.brand.update({
            where: { id: params.id },
            data: {
                name,
                description,
                imageUrl,
                website,
                status: status || 'ACTIVE',
                sortOrder: sortOrder ?? 0,
            }
        });

        return NextResponse.json({ success: true, data: brand });
    } catch (error: any) {
        console.error('Error updating brand:', error);
        return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
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

        const existingBrand = await prisma.brand.findUnique({
            where: { id: params.id }
        });

        if (!existingBrand) {
            return NextResponse.json({ error: 'Marca no encontrada' }, { status: 404 });
        }

        const productsCount = await prisma.product.count({
            where: { id: existingBrand.id }
        });

        if (productsCount > 0) {
            return NextResponse.json({ error: 'No se puede eliminar una marca que tiene productos asociados' }, { status: 400 });
        }

        await prisma.brand.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting brand:', error);
        return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
    }
}
