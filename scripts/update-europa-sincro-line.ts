import { prisma } from '../lib/db';

async function main() {
  const targetLineId = 'cmm84nt320003le11aj08cogk';
  
  const productsToUpdate = await prisma.product.findMany({
    where: {
      name: {
        contains: 'Europa Sincro',
        mode: 'insensitive',
      },
      NOT: {
        linea: targetLineId
      }
    },
    select: {
      id: true,
      name: true,
      linea: true,
    },
  });

  console.log(`Updating ${productsToUpdate.length} products to line ID: ${targetLineId}`);

  for (const product of productsToUpdate) {
    await prisma.product.update({
      where: { id: product.id },
      data: { linea: targetLineId },
    });
    console.log(`Updated product: ${product.name} (ID: ${product.id})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
