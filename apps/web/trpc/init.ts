import { auth } from '@/features/auth';
import { initTRPC, TRPCError } from '@trpc/server';
import { cache } from 'react';
import { headers } from 'next/headers';
import { polarClient } from '@/lib/polar';
import prisma from '@orchka/db';
import superjson from 'superjson';

export const createTRPCContext = cache(async () => {
    /**
     * @see: https://trpc.io/docs/server/context
     */
    const session = await auth.api.getSession({
        headers: await headers()
    });

    return {
        auth: session,
    };
});

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.context<TRPCContext>().create({
    /**
     * @see https://trpc.io/docs/server/data-transformers
     */
    transformer: superjson,
});

// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
export const protectedProcedure = baseProcedure.use(async ({ ctx, next }) => {
    // Reuse session from context instead of fetching again
    if (!ctx.auth) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Unauthorized',
        })
    }

    return next({
        ctx: {
            ...ctx,
            auth: ctx.auth, // Narrow the type to non-null
        },
    });
});

/**
 * orgProcedure: protected + resolves the active organization onto ctx.
 *
 * Looks at `session.activeOrganizationId` first; falls back to the user's
 * oldest membership so users that haven't explicitly switched orgs still
 * get scoped queries.
 */
export const orgProcedure = protectedProcedure.use(async ({ ctx, next }) => {
    let organizationId =
        (ctx.auth.session as { activeOrganizationId?: string | null } | undefined)
            ?.activeOrganizationId ?? undefined;

    if (!organizationId) {
        const fallback = await prisma.member.findFirst({
            where: { userId: ctx.auth.user.id },
            orderBy: { createdAt: 'asc' },
            select: { organizationId: true },
        });

        if (!fallback) {
            throw new TRPCError({
                code: 'PRECONDITION_FAILED',
                message: 'No organization. Create one to continue.',
            });
        }
        organizationId = fallback.organizationId;
    }

    return next({
        ctx: {
            ...ctx,
            organizationId,
        },
    });
});

export const premiumProcedure = protectedProcedure.use(async ({ ctx, next }) => {
    if (process.env.NODE_ENV !== "production") {
        return next({ ctx });
    }

    const customer = await polarClient.customers.getStateExternal({
        externalId: ctx.auth.user.id,
    })

    if (!customer.activeSubscriptions || customer.activeSubscriptions.length === 0) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You need a subscription to use this feature',
        })
    }

    return next({
        ctx: {
            ...ctx,
            customer,
        },
    });
});
