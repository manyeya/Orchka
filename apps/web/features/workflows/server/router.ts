import { PAGINATION } from "@/config/constants";
import prisma from "@orchka/db";
import { NodeType } from "@orchka/nodes/core";
import { createTRPCRouter, orgProcedure, premiumProcedure, protectedProcedure } from "@/trpc/init";
import { Edge, Node } from "@xyflow/react";
import { generateSlug } from "random-word-slugs";
import z from "zod";
import { workflowQueue } from "@orchka/workflow-engine/setup";
import { upsertWorkflowScheduler, removeWorkflowScheduler, getWorkflowScheduler } from "@orchka/workflow-engine/schedulers";

export const workflowsRouter = createTRPCRouter({
    getScheduleStatus: orgProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            // Verify workflow belongs to active org
            await prisma.workflow.findUniqueOrThrow({
                where: {
                    id: input.id,
                    organizationId: ctx.organizationId,
                }
            });

            const scheduler = await getWorkflowScheduler(input.id);

            return {
                isScheduled: !!scheduler,
                schedulerId: scheduler?.id || null,
                pattern: scheduler?.pattern || null,
            };
        }),
    executeWorkflow: orgProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
        const workflow = await prisma.workflow.findUniqueOrThrow({
            where: {
                id: input.id,
                organizationId: ctx.organizationId,
            }
        });

        const execution = await prisma.execution.create({
            data: {
                workflowId: input.id,
                userId: ctx.auth.user.id,
                organizationId: ctx.organizationId,
            }
        });

        await workflowQueue.add('execute-workflow', {
            workflowId: input.id,
            executionId: execution.id,
            userId: ctx.auth.user.id,
        });

        return workflow;
    }),

    scheduleWorkflow: orgProcedure
        .input(z.object({
            id: z.string(),
            cronPattern: z.string(),
            timezone: z.string().optional().default("UTC"),
        }))
        .mutation(async ({ ctx, input }) => {
            const workflow = await prisma.workflow.findUniqueOrThrow({
                where: {
                    id: input.id,
                    organizationId: ctx.organizationId,
                }
            });

            const schedulerId = `workflow-${input.id}`;

            await upsertWorkflowScheduler(schedulerId, {
                workflowId: input.id,
                cronPattern: input.cronPattern,
            });

            return {
                ...workflow,
                scheduled: true,
                schedulerId,
                cronPattern: input.cronPattern,
                timezone: input.timezone,
            };
        }),

    unscheduleWorkflow: orgProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const workflow = await prisma.workflow.findUniqueOrThrow({
                where: {
                    id: input.id,
                    organizationId: ctx.organizationId,
                }
            });

            const schedulerId = `workflow-${input.id}`;
            await removeWorkflowScheduler(schedulerId);

            return { ...workflow, scheduled: false };
        }),
    createWorkflow: premiumProcedure.use(async ({ ctx, next }) => {
        // Resolve active org for this premium call. Inline so we don't have to
        // build a premiumOrgProcedure for one use site.
        let organizationId =
            (ctx.auth.session as { activeOrganizationId?: string | null } | undefined)
                ?.activeOrganizationId ?? undefined;
        if (!organizationId) {
            const m = await prisma.member.findFirst({
                where: { userId: ctx.auth.user.id },
                orderBy: { createdAt: 'asc' },
                select: { organizationId: true },
            });
            if (!m) throw new Error('No organization');
            organizationId = m.organizationId;
        }
        return next({ ctx: { ...ctx, organizationId } });
    }).mutation(({ ctx }) => {
        return prisma.workflow.create({
            data: {
                name: generateSlug(3),
                userId: ctx.auth.user.id,
                organizationId: ctx.organizationId,
                nodes: {
                    create: {
                        name: NodeType.INITIAL,
                        type: NodeType.INITIAL,
                        position: {
                            x: 0,
                            y: 0,
                        },
                    }
                }
            }
        });
    }),
    removeWorkflow: orgProcedure.input(z.object({ id: z.string() })).mutation(({ ctx, input }) => {
        return prisma.workflow.delete({
            where: {
                id: input.id,
                organizationId: ctx.organizationId,
            }
        })
    }),
    updateWorkflow: orgProcedure
        .input(z.object({
            id: z.string(),
            nodes: z.array(z.object({
                id: z.string(),
                type: z.string().nullish(),
                position: z.object({
                    x: z.number(),
                    y: z.number(),
                }),
                data: z.record(z.string(), z.any()),
            })),
            edges: z.array(z.object({
                source: z.string(),
                target: z.string(),
                sourceHandle: z.string(),
                targetHandle: z.string(),
            }))
        }))
        .mutation(async ({ ctx, input }) => {
            const { id, nodes, edges } = input;
            const workflow = await prisma.workflow.findUniqueOrThrow({
                where: {
                    id,
                    organizationId: ctx.organizationId,
                },
                include: {
                    nodes: true,
                    connections: true,
                }
            })

            return prisma.$transaction(async (tx) => {
                await tx.node.deleteMany({
                    where: {
                        workflowId: id,
                    }
                });

                await tx.connection.deleteMany({
                    where: {
                        workflowId: id,
                    }
                });

                await tx.node.createMany({
                    data: nodes.map(node => ({
                        id: node.id,
                        name: (node.data?.name as string) || node.type || "unknown",
                        type: node.type as NodeType,
                        position: node.position,
                        data: node.data || {},
                        workflowId: id,
                    }))
                })

                await tx.connection.createMany({
                    data: edges.map(edge => ({
                        fromNodeId: edge.source,
                        toNodeId: edge.target,
                        fromOutput: edge.sourceHandle || "main",
                        toInput: edge.targetHandle || "main",
                        workflowId: id,
                    }))
                })

                await tx.workflow.update({
                    where: {
                        id,
                        organizationId: ctx.organizationId,
                    },
                    data: {
                        updatedAt: new Date(),
                    }
                })

                return workflow
            })

        }),

    updateWorkflowName: orgProcedure
        .input(z.object({ id: z.string(), name: z.string().min(1) }))
        .mutation(({ ctx, input }) => {
            return prisma.workflow.update({
                where: {
                    id: input.id,
                    organizationId: ctx.organizationId,
                },
                data: {
                    name: input.name,
                }
            })
        }),
    getOneWorkflow: orgProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
        const workflow = await prisma.workflow.findUniqueOrThrow({
            where: {
                id: input.id,
                organizationId: ctx.organizationId,
            }, include: {
                nodes: true,
                connections: true,
            }
        })

        const nodes: Node[] = workflow.nodes.map(node => {
            const nodeData = node.data as Record<string, unknown>;
            return {
                id: node.id,
                type: node.type,
                position: node.position as { x: number; y: number },
                style: (nodeData.style as React.CSSProperties) || undefined,
                parentId: (nodeData.parentId as string) || undefined,
                extent: (nodeData.extent as "parent") || undefined,
                data: {
                    ...nodeData,
                    name: node.name,
                },
            };
        })

        const edges: Edge[] = workflow.connections.map(connection => ({
            id: connection.id,
            source: connection.fromNodeId,
            target: connection.toNodeId,
            sourceHandle: connection.fromOutput,
            targetHandle: connection.toInput,
        }))

        return {
            id: workflow.id,
            name: workflow.name,
            nodes,
            edges,
        }
    }),
    getWorkflows: orgProcedure
        .input(z.object({
            page: z.number().min(1).default(PAGINATION.DEFAULT_PAGE),
            pageSize: z.number()
                .min(PAGINATION.MIN_PAGE_SIZE)
                .max(PAGINATION.MAX_PAGE_SIZE)
                .default(PAGINATION.DEFAULT_PAGE_SIZE),
            search: z.string().default(""),
            sort: z
                .enum([
                    "updated-desc",
                    "updated-asc",
                    "created-desc",
                    "created-asc",
                    "name-asc",
                    "name-desc",
                ])
                .default("updated-desc"),
        }))
        .query(async ({ ctx, input }) => {
            const { page, pageSize, search, sort } = input;
            const orderBy = ({
                "updated-desc": { updatedAt: "desc" },
                "updated-asc": { updatedAt: "asc" },
                "created-desc": { createdAt: "desc" },
                "created-asc": { createdAt: "asc" },
                "name-asc": { name: "asc" },
                "name-desc": { name: "desc" },
            } as const)[sort];
            const [items, count] = await Promise.all([
                prisma.workflow.findMany({
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                    where: {
                        organizationId: ctx.organizationId,
                        name: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                    orderBy,
                }),
                prisma.workflow.count({
                    where: {
                        organizationId: ctx.organizationId,
                        name: {
                            contains: search,
                            mode: "insensitive",
                        }
                    },
                })
            ])

            const totalPages = Math.ceil(count / pageSize);
            const hasNext = page < totalPages;
            const hasPrevious = page > 1;

            return {
                items,
                page,
                pageSize,
                count,
                totalPages,
                hasNext,
                hasPrevious,
            }
        })
})
