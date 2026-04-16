import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting archival process for collection: Line+Jaladera');

  const productsToArchive = await prisma.product.findMany({
    where: {
      coleccion: {
        contains: 'Line+Jaladera',
        mode: 'insensitive'
      },
      status: 'ACTIVE'
    }
  });

  console.log(`Found ${productsToArchive.length} active products to archive.`);

  if (productsToArchive.length === 0) {
    console.log('No active products found in this collection to archive.');
    return;
  }

  const result = await prisma.product.updateMany({
    where: {
      coleccion: {
        contains: 'Line+Jaladera',
        mode: 'insensitive'
      }
    },
    data: {
      status: 'INACTIVE'
    }
  });

  console.log(`Successfully archived ${result.count} products.`);
}

main()
  .catch((e) => {
    console.error('Error during archival:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
