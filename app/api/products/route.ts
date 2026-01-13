
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';
import { adminAuthGuard } from '@/lib/authUtils';

export const dynamic = 'force-dynamic';

// GET /api/products - Get all products (public access for catalog)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const categoryId = searchParams.get('categoryId');
    const status = searchParams.get('status');
    const featured = searchParams.get('featured');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    const where: any = {};

    // For non-authenticated users, only show active products
    if (!session) {
      where.status = 'ACTIVE';
    } else {
      // For authenticated users, apply status filter if provided
      if (status) {
        where.status = status;
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (featured === 'true') {
      where.featured = true;
    }

    const orderBy: any = {};
    if (sortBy === 'price') {
      orderBy['basePrice'] = sortOrder;
    } else if (sortBy === 'newest') {
      orderBy['createdAt'] = sortOrder;
    } else {
      orderBy[sortBy] = sortOrder;
    }

    const includeOptions: any = {
      category: true,
      doorType: true,
      doorModel: true,
      colorTone: true,
      productTone: true,
      woodGrain: true,
      line: true,
      edgeBandingRef: true,
      handleRef: true,
      _count: {
        select: { quoteItems: true }
      }
    };

    // Include pricing based on user role if authenticated
    if (session) {
      includeOptions.pricing = {
        where: { userRole: session.user.role as UserRole }
      };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: includeOptions,
        orderBy,
        skip,
        take: limit
      }),
      prisma.product.count({ where })
    ]);

    // Format response for both authenticated and public users
    const responseData = {
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create new product
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const authGuardResponse = adminAuthGuard(session)
    if (authGuardResponse) return authGuardResponse

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
      status,
      doorTypeId,
      doorModelId,
      colorToneId,
      woodGrainId,
      minHeight,
      maxHeight,
      lineId,
      productToneId,
      edgeBandingId,
      handleId,
      faces,
      orientation
    } = body;

    if (!name || !sku || !categoryId) {
      return NextResponse.json(
        { error: 'Nombre, SKU y categoría son requeridos' },
        { status: 400 }
      );
    }

    // Check if SKU already exists
    const existingSku = await prisma.product.findUnique({
      where: { sku }
    });

    if (existingSku) {
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

    const product = await prisma.product.create({
      data: {
        name,
        description,
        sku,
        categoryId,
        width,
        height,
        depth,
        weight,
        dimensionUnit: dimensionUnit || 'mm',
        weightUnit: weightUnit || 'kg',
        basePrice: basePrice || 0,
        currency: currency || 'MXN',
        images: images || [],
        model3d,
        thumbnail,
        isCustomizable: isCustomizable ?? true,
        leadTime: leadTime || 7,
        minQuantity: minQuantity || 1,
        maxQuantity,
        tags: tags || [],
        featured: featured || false,
        status: status || 'ACTIVE',
        doorTypeId,
        doorModelId,
        colorToneId,
        woodGrainId,
        // New characteristic fields
        minHeight,
        maxHeight,
        lineId,
        productToneId,
        edgeBandingId,
        handleId,
        faces,
        orientation
      },
      include: {
        category: true,
        doorType: true,
        doorModel: true,
        colorTone: true,
        productTone: true,
        woodGrain: true,
        line: true,
        edgeBandingRef: true,
        handleRef: true,
        pricing: true
      }
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
