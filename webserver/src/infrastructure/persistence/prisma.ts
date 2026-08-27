import { PrismaClient } from '@prisma/client';

// Evita crear múltiples instancias de PrismaClient con el hot-reload de `next dev`.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
