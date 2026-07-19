import { PrismaClient } from '@prisma/client';
import path from 'path';

// Compute absolute path to SQLite database file to avoid relative path ambiguity in Next.js Server routes
const dbPath = path.resolve(process.cwd(), 'prisma/dev.db');

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: `file:${dbPath}`,
      },
    },
    log: ['query', 'error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
