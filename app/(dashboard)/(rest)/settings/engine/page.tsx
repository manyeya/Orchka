import React, { Suspense } from 'react'
import { BullMQDashboard } from '@/features/admin/components/bullmq-dashboard'
import { BullMQContainer, BullMQErrorView, BullMQLoadingView } from '@/features/admin/components/bullmq-dashboard-container'
import { prefetchBullMQStats } from '@/features/admin/server/prefetch'
import { HydrateClient } from '@/trpc/server'
import { ErrorBoundary } from 'react-error-boundary'
import { requireAuth } from '@/lib/auth/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: "BullMQ Engine",
    description: "Monitor and manage the BullMQ task processing engine.",
    robots: {
        index: false,
        follow: false,
    },
}

async function AdminBullMQPage() {
    await requireAuth()
    await prefetchBullMQStats()

    return (
        <BullMQContainer>
            <HydrateClient>
                <ErrorBoundary fallback={<BullMQErrorView />}>
                    <Suspense fallback={<BullMQLoadingView />}>
                        <BullMQDashboard />
                    </Suspense>
                </ErrorBoundary>
            </HydrateClient>
        </BullMQContainer>
    )
}

export default AdminBullMQPage
