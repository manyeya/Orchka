import { PAGINATION } from "@/config/constants";
import prisma from "@orchka/db";
import { createTRPCRouter, orgProcedure } from "@/trpc/init";
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

const seriesSchema = z.object({
  windowDays: z.number().int().min(1).max(90).default(7),
});

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  ));
}

export const executionsRouter = createTRPCRouter({
  list: orgProcedure
    .input(listExecutionsSchema)
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search, workflowId, status } = input;

      const whereClause = {
        organizationId: ctx.organizationId,
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

  getById: orgProcedure
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

      if (execution.organizationId !== ctx.organizationId) {
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


  stats: orgProcedure
    .input(statsSchema)
    .query(async ({ ctx, input }) => {
      const organizationId = ctx.organizationId;
      const today = new Date();
      const sinceDay = new Date(Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        today.getUTCDate() - (input.windowDays - 1),
      ));

      // All-time total comes from the rollup; running executions don't appear
      // there yet, so add them in for accuracy.
      const [allTimeAgg, windowAgg, runningCount] = await Promise.all([
        prisma.executionStat.aggregate({
          where: { organizationId },
          _sum: { total: true },
        }),
        prisma.executionStat.aggregate({
          where: { organizationId, date: { gte: sinceDay } },
          _sum: {
            total: true,
            succeeded: true,
            failed: true,
            cancelled: true,
            durationMs: true,
          },
        }),
        prisma.execution.count({
          where: { organizationId, status: ExecutionStatus.RUNNING },
        }),
      ]);

      const rolledTotal = allTimeAgg._sum.total ?? 0;
      const succeeded = windowAgg._sum.succeeded ?? 0;
      const failed = windowAgg._sum.failed ?? 0;
      const cancelled = windowAgg._sum.cancelled ?? 0;
      const windowTotal = windowAgg._sum.total ?? 0;
      const durationMsSum = Number(windowAgg._sum.durationMs ?? BigInt(0));

      const finished = succeeded + failed;
      const successRate = finished > 0 ? succeeded / finished : null;
      const avgDurationMs = succeeded > 0 ? Math.round(durationMsSum / succeeded) : null;

      return {
        windowDays: input.windowDays,
        total: rolledTotal + runningCount,
        windowTotal,
        succeeded,
        failed,
        running: runningCount,
        cancelled,
        successRate,
        avgDurationMs,
      };
    }),

  series: orgProcedure
    .input(seriesSchema)
    .query(async ({ ctx, input }) => {
      const organizationId = ctx.organizationId;
      const today = startOfUtcDay(new Date());
      const sinceDay = new Date(today);
      sinceDay.setUTCDate(today.getUTCDate() - (input.windowDays - 1));

      const rows = await prisma.executionStat.groupBy({
        by: ["date"],
        where: { organizationId, date: { gte: sinceDay } },
        _sum: { succeeded: true, failed: true, cancelled: true, total: true },
        orderBy: { date: "asc" },
      });

      const byKey = new Map(
        rows.map((row) => [
          row.date.toISOString().slice(0, 10),
          {
            succeeded: row._sum.succeeded ?? 0,
            failed: row._sum.failed ?? 0,
            cancelled: row._sum.cancelled ?? 0,
            total: row._sum.total ?? 0,
          },
        ]),
      );

      // Zero-fill any day in the window without rollup rows so the chart's
      // x-axis is contiguous instead of skipping idle days.
      const points: Array<{
        date: string;
        succeeded: number;
        failed: number;
        cancelled: number;
        total: number;
      }> = [];
      for (let i = 0; i < input.windowDays; i++) {
        const day = new Date(sinceDay);
        day.setUTCDate(sinceDay.getUTCDate() + i);
        const key = day.toISOString().slice(0, 10);
        const bucket = byKey.get(key) ?? { succeeded: 0, failed: 0, cancelled: 0, total: 0 };
        points.push({ date: key, ...bucket });
      }

      return { windowDays: input.windowDays, points };
    }),

  getByWorkflowId: orgProcedure
    .input(z.object({ workflowId: z.string() }))
    .query(async ({ ctx, input }) => {
      const executions = await prisma.execution.findMany({
        where: {
          workflowId: input.workflowId,
          organizationId: ctx.organizationId,
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
