import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { adminAuthGuard } from '@/lib/authUtils';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const search = searchParams.get('search');
    const linea = searchParams.get('linea');
    const categoria = searchParams.get('categoria');
    const coleccion = searchParams.get('coleccion');
    const tiempoEntrega = searchParams.get('tiempoEntrega');

    const skip = (page - 1) * limit;

    // Build the SQL query parts dynamically
    let sqlFilters = [`p.status = 'ACTIVE'`];
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      const pIdx = params.length;
      sqlFilters.push(`(p.name ILIKE $${pIdx} OR p."tonoColor" ILIKE $${pIdx} OR p.coleccion ILIKE $${pIdx} OR p.linea ILIKE $${pIdx} OR p.categoria ILIKE $${pIdx})`);
    }

    if (linea) {
      const line = await prisma.productLine.findFirst({
        where: {
          OR: [
            { id: linea },
            { name: { contains: linea, mode: 'insensitive' } }
          ]
        }
      });
      if (line) {
        params.push(`%${line.name}%`);
        sqlFilters.push(`p.linea ILIKE $${params.length}`);
      }
    }

    if (categoria) {
      params.push(categoria);
      sqlFilters.push(`p.categoria = $${params.length}`);
    }

    if (coleccion) {
      params.push(coleccion);
      sqlFilters.push(`p.coleccion = $${params.length}`);
    }

    if (tiempoEntrega) {
      params.push(parseInt(tiempoEntrega));
      sqlFilters.push(`p."tiempoEntrega" = $${params.length}`);
    }

    const whereClause = sqlFilters.join(' AND ');

    // 1. Fetch total counts
    const totalAllRaw: any[] = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM products WHERE status = 'ACTIVE'`;
    const totalAll = totalAllRaw[0]?.count || 0;

    const countQuery = `SELECT COUNT(*)::int as count FROM products p WHERE ${whereClause}`;
    const totalFilteredRaw: any[] = await prisma.$queryRawUnsafe(countQuery, ...params);
    const totalFiltered = totalFilteredRaw[0]?.count || 0;

    // 2. Fetch products
    const limitParam = limit;
    const offsetParam = skip;
    const dataQuery = `
      SELECT id, name, "precioBaseM2", images, categoria, linea, "tonoColor", "tonoVidrio", coleccion, "tiempoEntrega" 
      FROM products p 
      WHERE ${whereClause} 
      ORDER BY p."createdAt" DESC 
      LIMIT ${limitParam} OFFSET ${offsetParam}
    `;
    
    // Note: We use queryRawUnsafe because whereClause is built dynamically, 
    // but the parameters are safely passed via $1, $2, etc.
    const products: any[] = await prisma.$queryRawUnsafe(dataQuery, ...params);

    const lineIds = Array.from(new Set(products.map(p => p.linea).filter((l): l is string => !!l)));
    
    let linesMap = new Map();
    if (lineIds.length > 0) {
      const lines = await prisma.productLine.findMany({
        where: { id: { in: lineIds } },
        select: { id: true, name: true }
      });
      linesMap = new Map(lines.map((l: { id: string; name: string }) => [l.id, l.name]));
    }

    const productsWithLine = products.map((p: any) => ({
      ...p,
      lineaName: p.linea ? linesMap.get(p.linea) || p.linea : null
    }));

    const hasFilters = !!(search || linea || categoria || coleccion || tiempoEntrega);

    return NextResponse.json({
      success: true,
      products: productsWithLine,
      pagination: {
        page,
        limit,
        total: totalFiltered,
        totalAll,
        pages: Math.ceil(totalFiltered / limit),
        hasFilters
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=300',
      }
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const product = await prisma.product.create({
      data: {
        name: name || 'Producto',
        categoryId: categoryId || 'default',
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
        ventanaAltoMin,
        ventanaAltoMax,
        images,
      }
    });

    return NextResponse.json({
      success: true,
      product
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}