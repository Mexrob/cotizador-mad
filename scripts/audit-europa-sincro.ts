import { prisma } from '../lib/db';

async function main() {
  const products = await prisma.product.findMany({
    where: {
      name: {
        contains: 'Europa Sincro',
        mode: 'insensitive',
      },
    },
    select: {
      id: true,
      name: true,
      linea: true,
    },
  });

  const lines = await prisma.productLine.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  console.log('Products found:', products);
  console.log('Available lines:', lines);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
