
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [lines, handles, backFaces] = await Promise.all([
      prisma.productLine.findMany({
        where: { isActive: true },
        include: {
          tones: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' }
          }
        },
        orderBy: { sortOrder: 'asc' }
      }),
      (prisma as any).handleModel.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' }
      }),
      (prisma as any).productBackFace.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' }
      })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        lines,
        handles,
        backFaces
      }
    });
  } catch (error) {
    console.error('Error fetching kit configuration:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener la configuración del kit' },
      { status: 500 }
    );
  }
}
