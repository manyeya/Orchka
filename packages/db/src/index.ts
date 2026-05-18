import { PrismaClient } from "../prisma/generated/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && process.env.NODE_ENV !== 'test') {
    console.warn("⚠️  DATABASE_URL is not defined in environment variables. Prisma Client may fail.");
}

const prisma = globalForPrisma.prisma || new PrismaClient({
    datasources: {
        db: {
            url: databaseUrl,
        },
    },
});

if (process.env.NODE_ENV !== "production") {
    // Detect a stale cached client (newest model missing) and rebuild so dev
    // hot reloads pick up new Prisma models without a process restart.
    const newestModel = "executionStat" as const;
    if (prisma && !(prisma as unknown as Record<string, unknown>)[newestModel]) {
        globalForPrisma.prisma = new PrismaClient({
            datasources: {
                db: {
                    url: databaseUrl,
                },
            },
        });
    } else {
        globalForPrisma.prisma = prisma;
    }
}

export default globalForPrisma.prisma || prisma;

// Re-export all Prisma types and enums for convenience
export * from "../prisma/generated/client";
