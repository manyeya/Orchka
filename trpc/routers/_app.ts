import { inngest } from '@/inngest/client';
import { protectedProcedure, createTRPCRouter } from '../init';
import prisma from '@/lib/db';

export const appRouter = createTRPCRouter({
    getWorkflows: protectedProcedure.query(({ ctx }) => {
        return prisma.workflow.findMany();
    }),
    createWorkflow: protectedProcedure.mutation(async ({ ctx }) => {
        const user = ctx.auth.user;

        await inngest.send({
            name: "test/hello.world",
            data: {
                email: user.email,
            },
        });

        return {
            message: "Job Queued",
            success: true,
        };
    }),
});

export type AppRouter = typeof appRouter;