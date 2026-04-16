
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { adminAuthGuard } from '@/lib/authUtils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const authGuardResponse = adminAuthGuard(session);
    if (authGuardResponse) return authGuardResponse;

    const body = await request.json();
    const { products } = body;

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No se proporcionaron productos' },
        { status: 400 }
      );
    }

    const imported: string[] = [];
    const errors: string[] = [];

    console.log('Products to import:', JSON.stringify(products.slice(0, 3), null, 2));

    for (const productData of products) {
      try {
        if (!productData.name) {
          errors.push(`Producto sin nombre omitido`);
          continue;
        }

        const product = await prisma.product.create({
          data: {
            name: productData.name,
            categoryId: productData.categoryId || 'default',
            categoria: productData.categoria || '',
            coleccion: productData.coleccion || '',
            linea: productData.linea || '',
            tonoColor: productData.tonoColor || '',
            tonoVidrio: productData.tonoVidrio || '',
            tonoAluminio: productData.tonoAluminio || '',
            precioBaseM2: productData.precioBaseM2 || 0,
            precioVidrio: productData.precioVidrio || 0,
            tiempoEntrega: productData.tiempoEntrega || 7,
            puertaAnchoMin: productData.puertaAnchoMin || 0,
            puertaAnchoMax: productData.puertaAnchoMax || 0,
            puertaAltoMin: productData.puertaAltoMin || 0,
            puertaAltoMax: productData.puertaAltoMax || 0,
            frenteAnchoMin: productData.frenteAnchoMin || 0,
            frenteAnchoMax: productData.frenteAnchoMax || 0,
            frenteAltoMin: productData.frenteAltoMin || 0,
            frenteAltoMax: productData.frenteAltoMax || 0,
            ventanaAnchoMin: productData.ventanaAnchoMin || 0,
            ventanaAnchoMax: productData.ventanaAnchoMax || 0,
            ventanaAltoMin: productData.ventanaAltoMin || 0,
            ventanaAltoMax: productData.ventanaAltoMax || 0,
          },
        });

        imported.push(product.id);
      } catch (error: any) {
        console.error('Error creating product:', productData.name, error);
        errors.push(`Error con ${productData.name}: ${error.message}`);
      }
    }

    console.log('Imported:', imported.length, 'Errors:', errors.length);
    return NextResponse.json({
      success: true,
      imported: imported.length,
      errors: errors,
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
