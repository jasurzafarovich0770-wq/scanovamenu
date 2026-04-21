import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Menu seed skipped (no demo data)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
