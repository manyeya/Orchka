import { PAGINATION } from "@/config/constants";
import prisma from "@orchka/db";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { ExecutionStatus } from "@orchka/db/enums";
import { TRPCError } from "@trpc/server";
import Redis from "ioredis";
import z from "zod";

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

/**
 * Lazy persistence: Fetch execution steps from Redis if not in DB
 * This allows us to avoid DB writes during execution while maintaining history
 */
async function getExecutionStepsWithLazyPersist(executionId: string, workflowId: string) {
  // First, try to get steps from database
  const dbSteps = await prisma.executionStep.findMany({
    where: { executionId },
    orderBy: { startedAt: "asc" },
  });

  // If steps exist in DB, return them
  if (dbSteps.length > 0) {
    return dbSteps;
  }

  // No steps in DB - fetch from Redis history and persist
  console.log(`[Lazy Persist] No steps found in DB for execution ${executionId}, fetching from Redis...`);

  // Use execution-specific Redis key
  const historyKey = `workflow:${workflowId}:execution:${executionId}:history`;
  const redisEvents = await redis.lrange(historyKey, 0, 100);

  if (redisEvents.length === 0) {
    console.log(`[Lazy Persist] No events in Redis for execution ${executionId}`);
    return [];
  }

  // Parse events and build steps
  const steps: Array<{
    id: string;
    executionId: string;
    nodeId: string;
    nodeName: string;
    nodeType: string;
    status: string;
    startedAt: Date;
    completedAt: Date | null;
    input: any;
    output: any;
    error: string | null;
  }> = [];

  const nodeStates = new Map<string, {
    startedAt: number | null;
    completedAt: number | null;
    nodeName: string;
    nodeType: string;
    input: any;
    output: any;
    status: string;
    error: string | null;
  }>();

  // Process events to build step records
  for (const eventStr of redisEvents.reverse()) {
    try {
      const { payload, timestamp } = JSON.parse(eventStr);

      // Only process node-status events
      if (payload.type !== 'node-status') {
        continue;
      }

      const nodeId = payload.nodeId;
      const state = nodeStates.get(nodeId) || {
        startedAt: null,
        completedAt: null,
        nodeName: '',
        nodeType: '',
        input: null,
        output: null,
        status: 'PENDING',
        error: null,
      };

      if (payload.status === 'loading' && !state.startedAt) {
        state.startedAt = timestamp;
        state.nodeName = payload.nodeName || '';
        state.nodeType = payload.nodeType || '';
        state.input = payload.input;
        state.status = 'RUNNING';
      } else if (payload.status === 'success') {
        state.completedAt = timestamp;
        state.output = payload.output;
        state.status = 'COMPLETED';
      } else if (payload.status === 'error') {
        state.completedAt = timestamp;
        state.error = payload.error;
        state.status = 'FAILED';
      }

      nodeStates.set(nodeId, state);
    } catch (e) {
      console.error('[Lazy Persist] Failed to parse Redis event:', e);
    }
  }

  // Convert to step records and persist to DB
  for (const [nodeId, state] of nodeStates.entries()) {
    if (state.startedAt) {
      const step = {
        id: `${executionId}-${nodeId}`,
        executionId,
        nodeId,
        nodeName: state.nodeName,
        nodeType: state.nodeType,
        status: state.status as "RUNNING" | "COMPLETED" | "FAILED",
        startedAt: new Date(state.startedAt),
        completedAt: state.completedAt ? new Date(state.completedAt) : null,
        input: state.input,
        output: state.output,
        error: state.error,
      };
      steps.push(step);
    }
  }

  // Bulk insert steps to DB for future queries
  if (steps.length > 0) {
    try {
      await prisma.executionStep.createMany({
        data: steps,
        skipDuplicates: true,
      });
      console.log(`[Lazy Persist] Persisted ${steps.length} steps to DB for execution ${executionId}`);
    } catch (e) {
      console.error('[Lazy Persist] Failed to persist steps:', e);
      // Return steps from memory even if persist fails
    }
  }

  return steps;
}

const listExecutionsSchema = z.object({
  workflowId: z.string().optional(),
  status: z.string().optional(),
  page: z.number().min(1).default(PAGINATION.DEFAULT_PAGE),
  pageSize: z.number()
    .min(PAGINATION.MIN_PAGE_SIZE)
    .max(PAGINATION.MAX_PAGE_SIZE)
    .default(PAGINATION.DEFAULT_PAGE_SIZE),
  search: z.string().default(""),
});

const getExecutionSchema = z.object({
  id: z.string(),
});

const statsSchema = z.object({
  windowDays: z.number().int().min(1).max(90).default(7),
});

export const executionsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(listExecutionsSchema)
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search, workflowId, status } = input;

      const whereClause = {
        userId: ctx.auth.user.id,
        ...(workflowId && { workflowId }),
        ...(status && status in ExecutionStatus && { status: status as ExecutionStatus }),
        ...(search && {
          workflow: {
            name: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
        }),
      };

      const [executions, count] = await Promise.all([
        prisma.execution.findMany({
          skip: (page - 1) * pageSize,
          take: pageSize,
          where: whereClause,
          include: {
            workflow: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { startedAt: "desc" },
        }),
        prisma.execution.count({ where: whereClause }),
      ]);

      const totalPages = Math.ceil(count / pageSize);
      const hasNext = page < totalPages;
      const hasPrevious = page > 1;

      return {
        items: executions.map((e) => ({
          id: e.id,
          workflowId: e.workflowId,
          workflowName: e.workflow.name,
          status: e.status,
          inngestRunId: e.inngestRunId,
          startedAt: e.startedAt,
          completedAt: e.completedAt,
          error: e.error,
        })),
        page,
        pageSize,
        count,
        totalPages,
        hasNext,
        hasPrevious,
      };
    }),

  getById: protectedProcedure
    .input(getExecutionSchema)
    .query(async ({ ctx, input }) => {
      const execution = await prisma.execution.findUnique({
        where: { id: input.id },
        include: {
          workflow: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!execution) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Execution not found",
        });
      }

      if (execution.userId !== ctx.auth.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to access this execution",
        });
      }

      // OPTIMIZATION: Lazy load steps from Redis if not in DB
      const steps = await getExecutionStepsWithLazyPersist(execution.id, execution.workflowId);

      return {
        id: execution.id,
        workflowId: execution.workflowId,
        workflowName: execution.workflow.name,
        status: execution.status,
        inngestRunId: execution.inngestRunId,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt,
        result: execution.result,
        error: execution.error,
        steps,
      };
    }),


  stats: protectedProcedure
    .input(statsSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.auth.user.id;
      const since = new Date(Date.now() - input.windowDays * 24 * 60 * 60 * 1000);

      const [total, windowAgg] = await Promise.all([
        prisma.execution.count({ where: { userId } }),
        prisma.execution.groupBy({
          by: ["status"],
          where: { userId, startedAt: { gte: since } },
          _count: { _all: true },
        }),
      ]);

      const counts = Object.fromEntries(
        windowAgg.map((row) => [row.status, row._count._all]),
      ) as Partial<Record<ExecutionStatus, number>>;

      const succeeded = counts.COMPLETED ?? 0;
      const failed = counts.FAILED ?? 0;
      const running = counts.RUNNING ?? 0;
      const cancelled = counts.CANCELLED ?? 0;
      const windowTotal = succeeded + failed + running + cancelled;
      const finished = succeeded + failed;
      const successRate = finished > 0 ? succeeded / finished : null;

      const completed = await prisma.execution.findMany({
        where: {
          userId,
          status: ExecutionStatus.COMPLETED,
          startedAt: { gte: since },
          completedAt: { not: null },
        },
        select: { startedAt: true, completedAt: true },
      });

      let avgDurationMs: number | null = null;
      if (completed.length > 0) {
        const sum = completed.reduce(
          (acc, e) => acc + (e.completedAt!.getTime() - e.startedAt.getTime()),
          0,
        );
        avgDurationMs = Math.round(sum / completed.length);
      }

      return {
        windowDays: input.windowDays,
        total,
        windowTotal,
        succeeded,
        failed,
        running,
        cancelled,
        successRate,
        avgDurationMs,
      };
    }),

  getByWorkflowId: protectedProcedure
    .input(z.object({ workflowId: z.string() }))
    .query(async ({ ctx, input }) => {
      const executions = await prisma.execution.findMany({
        where: {
          workflowId: input.workflowId,
          userId: ctx.auth.user.id,
        },
        orderBy: { startedAt: "desc" },
        take: 10,
      });

      return executions.map((e) => ({
        id: e.id,
        status: e.status,
        startedAt: e.startedAt,
        completedAt: e.completedAt,
        error: e.error,
      }));
    }),
});
