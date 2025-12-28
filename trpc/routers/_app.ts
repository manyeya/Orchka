import { createTRPCRouter } from '../init';
import { workflowsRouter } from '@/features/workflows/server/router';
import { credentialsRouter } from '@/features/credentials/server/router';

export const appRouter = createTRPCRouter({
    workflows: workflowsRouter,
    credentials: credentialsRouter,
});

export type AppRouter = typeof appRouter;