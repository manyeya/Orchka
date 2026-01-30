import { createTRPCRouter } from '../init';
import { workflowsRouter } from '@/features/workflows/server/router';
import { credentialsRouter } from '@/features/credentials/server/router';
import { executionsRouter } from '@/features/executions/server/router';
import { adminRouter } from '@/features/admin/server/router';

export const appRouter = createTRPCRouter({
    workflows: workflowsRouter,
    credentials: credentialsRouter,
    executions: executionsRouter,
    admin: adminRouter,
});

export type AppRouter = typeof appRouter;