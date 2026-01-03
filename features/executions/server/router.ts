import { PAGINATION } from "@/config/constants";
import prisma from "@/lib/db";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { ExecutionStatus } from "@/lib/generated/prisma/client";
import { TRPCError } from "@trpc/server";
import z from "zod";

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
          steps: {
            orderBy: { startedAt: "asc" },
          }
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
        steps: execution.steps,
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
