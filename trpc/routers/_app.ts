import { protectedProcedure, createTRPCRouter } from '../init';
import prisma from '@/lib/db';

export const appRouter = createTRPCRouter({
    getUsers: protectedProcedure.query(({ ctx }) => {
        return prisma.user.findMany();
    }),
});

export type AppRouter = typeof appRouter;