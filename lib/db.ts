import { PrismaClient } from "@/lib/generated/prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma = globalForPrisma.prisma || new PrismaClient();

// In development, if the client is stale (missing new models after migration), force a new instance
if (process.env.NODE_ENV !== "production") {
    if (prisma && !(prisma as any).executionStep) {
        globalForPrisma.prisma = new PrismaClient();
    } else {
        globalForPrisma.prisma = prisma;
    }
}

export default globalForPrisma.prisma || prisma;
