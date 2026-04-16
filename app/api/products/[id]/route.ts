
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { adminAuthGuard } from '@/lib/authUtils';

export const dynamic = 'force-dynamic';

// GET /api/products/[id] - Get product by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error: any) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    const authGuardResponse = adminAuthGuard(session);
    if (authGuardResponse) return authGuardResponse;

    const body = await request.json();
    const {
      name,
      categoryId,
      categoria,
      coleccion,
      linea,
      tonoColor,
      tonoVidrio,
      tonoAluminio,
      precioBaseM2,
      tiempoEntrega,
      puertaAnchoMin,
      puertaAnchoMax,
      puertaAltoMin,
      puertaAltoMax,
      frenteAnchoMin,
      frenteAnchoMax,
      frenteAltoMin,
      frenteAltoMax,
      ventanaAnchoMin,
      ventanaAnchoMax,
      ventanaAltoMin,
      ventanaAltoMax,
      precioVidrio,
      images,
    } = body;

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        name,
        categoryId,
        categoria,
        coleccion,
        linea,
        tonoColor,
        tonoVidrio,
        tonoAluminio,
        precioBaseM2,
        tiempoEntrega,
        puertaAnchoMin,
        puertaAnchoMax,
        puertaAltoMin,
        puertaAltoMax,
        frenteAnchoMin,
        frenteAnchoMax,
        frenteAltoMin,
        frenteAltoMax,
        ventanaAnchoMin,
        ventanaAnchoMax,
        ventanaAltoMin,
        ventanaAltoMax,
        precioVidrio,
        images,
        status: body.status || 'ACTIVE',
      }
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    const authGuardResponse = adminAuthGuard(session);
    if (authGuardResponse) return authGuardResponse;

    await prisma.product.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
