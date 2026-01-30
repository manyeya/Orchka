"use client"

import React from "react"
import { Zap } from "lucide-react"
import { ErrorView, LoadingView } from "@/components/entity-component"

export const BullMQContainer = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="w-full p-6 md:p-8 max-w-[1600px] mx-auto h-full bg-background text-foreground">
            <div className="flex flex-col gap-6 mb-8">
                <div className="flex flex-row items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <Zap className="h-6 w-6 text-yellow-500" />
                            BullMQ Engine
                        </h1>
                        <p className="text-muted-foreground">Monitor and manage the background task processing engine</p>
                    </div>
                </div>
            </div>
            {children}
        </div>
    )
}

export const BullMQLoadingView = () => {
    return (
        <LoadingView entity="BullMQ Stats" />
    )
}

export const BullMQErrorView = () => {
    return (
        <ErrorView entity="BullMQ Stats" />
    )
}
