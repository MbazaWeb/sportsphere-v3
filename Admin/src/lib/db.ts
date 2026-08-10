import { PrismaClient } from '@prisma/client';

/**
 * Direct Prisma client for the admin app.
 *
 * The admin app reads and writes the SAME PostgreSQL database as the fan
 * web app. Both apps share the schema (prisma/schema.prisma) and the same
 * DATABASE_URL. Changes made by the admin app are immediately visible to
 * the fan app and the mobile app — they all read from the same tables.
 *
 * We use a global singleton to avoid exhausting the connection pool during
 * Next.js hot-reload in development.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['warn', 'error']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
