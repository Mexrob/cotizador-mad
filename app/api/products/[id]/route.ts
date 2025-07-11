
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';

export const dynamic = 'force-dynamic';

// GET /api/products/[id] - Get product by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        materials: true,
        hardware: true,
        pricing: {
          where: { userRole: session.user.role as UserRole }
        },
        _count: {
          select: { quoteItems: true }
        }
      }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
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
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      sku,
      categoryId,
      width,
      height,
      depth,
      weight,
      dimensionUnit,
      weightUnit,
      basePrice,
      currency,
      images,
      model3d,
      thumbnail,
      isCustomizable,
      leadTime,
      minQuantity,
      maxQuantity,
      tags,
      featured,
      status
    } = body;

    if (!name || !sku || !categoryId) {
      return NextResponse.json(
        { error: 'Nombre, SKU y categoría son requeridos' },
        { status: 400 }
      );
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id }
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    // Check if SKU already exists (but not for this product)
    const existingSku = await prisma.product.findUnique({
      where: { sku }
    });

    if (existingSku && existingSku.id !== params.id) {
      return NextResponse.json(
        { error: 'El SKU ya existe' },
        { status: 400 }
      );
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 400 }
      );
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        name,
        description,
        sku,
        categoryId,
        width,
        height,
        depth,
        weight,
        dimensionUnit,
        weightUnit,
        basePrice,
        currency,
        images,
        model3d,
        thumbnail,
        isCustomizable,
        leadTime,
        minQuantity,
        maxQuantity,
        tags,
        featured,
        status
      },
      include: {
        category: true,
        materials: true,
        hardware: true,
        pricing: true
      }
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
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
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { quoteItems: true }
        }
      }
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    // Check if product is used in quotes
    if (existingProduct._count.quoteItems > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un producto que está siendo usado en cotizaciones. Cambia su estado a DISCONTINUADO en su lugar.' },
        { status: 400 }
      );
    }

    await prisma.product.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Producto eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
