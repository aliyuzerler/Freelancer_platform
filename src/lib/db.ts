import { PrismaClient } from '@prisma/client';

/**
 * A single PrismaClient instance, reused across hot-reloads in development.
 * Next.js recreates modules on every change; without this guard we would leak
 * database connections and eventually exhaust the pool.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
