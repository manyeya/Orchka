import { inngest } from '@/inngest/client';
import { protectedProcedure, createTRPCRouter } from '../init';
import prisma from '@/lib/db';
import { TRPCError } from '@trpc/server';

export const appRouter = createTRPCRouter({
    ai: protectedProcedure.mutation(async ({ ctx }) => {
        // throw new TRPCError({
        //     code: "BAD_REQUEST",
        //     message: "Something went wrong",
        // });

        await inngest.send({
            name: "execute/ai",
        });
        return {
            message: "Job Queued",
            success: true,
        };
    }),

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