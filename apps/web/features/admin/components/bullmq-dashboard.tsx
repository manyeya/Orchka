"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@orchka/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@orchka/ui/chart";
import { Badge } from "@orchka/ui/badge";
import {
    Activity,
    CheckCircle2,
    XCircle,
    Clock,
    Zap,
    Pause,
    ArrowUpCircle,
    CalendarClock
} from "lucide-react";
import { useBullMQStats } from "../hooks/use-bullmq-stats";

const chartConfig = {
    active: {
        label: "Active",
        color: "hsl(var(--chart-1))",
    },
    completed: {
        label: "Completed",
        color: "hsl(var(--chart-2))",
    },
    failed: {
        label: "Failed",
        color: "hsl(var(--chart-3))",
    },
    waiting: {
        label: "Waiting",
        color: "hsl(var(--chart-4))",
    },
} satisfies ChartConfig;

export function BullMQDashboard() {
    const { data } = useBullMQStats();
    const [history, setHistory] = React.useState<any[]>([]);

    React.useEffect(() => {
        const timestamp = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const totals = data.queues.reduce((acc, q) => ({
            active: (acc.active || 0) + (q.active || 0),
            completed: (acc.completed || 0) + (q.completed || 0),
            failed: (acc.failed || 0) + (q.failed || 0),
            waiting: (acc.waiting || 0) + (q.waiting || 0),
        }), { active: 0, completed: 0, failed: 0, waiting: 0 });

        setHistory(prev => [...prev.slice(-19), { time: timestamp, ...totals }]);
    }, [data]);

    const totals = data?.queues.reduce((acc, q) => ({
        active: acc.active + q.active,
        completed: acc.completed + q.completed,
        failed: acc.failed + q.failed,
        delayed: acc.delayed + q.delayed,
        waiting: acc.waiting + q.waiting,
        paused: acc.paused + q.paused,
        prioritized: acc.prioritized + q.prioritized,
        scheduled: acc.scheduled + q.scheduledCount,
    }), { active: 0, completed: 0, failed: 0, delayed: 0, waiting: 0, paused: 0, prioritized: 0, scheduled: 0 });

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Active Jobs"
                    value={totals?.active || 0}
                    icon={<Activity className="h-4 w-4 text-blue-500" />}
                    description="Currently processing"
                />
                <StatCard
                    title="Waiting"
                    value={totals?.waiting || 0}
                    icon={<Clock className="h-4 w-4 text-orange-500" />}
                    description="In queue for worker"
                />
                <StatCard
                    title="Scheduled Tasks"
                    value={totals?.scheduled || 0}
                    icon={<CalendarClock className="h-4 w-4 text-purple-500" />}
                    description="Repeatable/Cron jobs"
                />
                <StatCard
                    title="Failed"
                    value={totals?.failed || 0}
                    icon={<XCircle className="h-4 w-4 text-red-500" />}
                    description="Execution errors"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Delayed"
                    value={totals?.delayed || 0}
                    icon={<Clock className="h-4 w-4 text-yellow-500 opacity-70" />}
                    description="Waiting for delay"
                    size="sm"
                />
                <StatCard
                    title="Paused"
                    value={totals?.paused || 0}
                    icon={<Pause className="h-4 w-4 text-gray-500" />}
                    description="Queues intentionally paused"
                    size="sm"
                />
                <StatCard
                    title="Prioritized"
                    value={totals?.prioritized || 0}
                    icon={<ArrowUpCircle className="h-4 w-4 text-green-500" />}
                    description="High priority tasks"
                    size="sm"
                />
                <StatCard
                    title="Completed (Lifetime)"
                    value={totals?.completed || 0}
                    icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
                    description="Cumulative success"
                    size="sm"
                />
            </div>

            <div className="grid gap-4 lg:grid-cols-7">
                <Card className="col-span-4 border-none bg-muted/30 shadow-none">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Zap className="h-5 w-5 text-yellow-500" />
                            Live Throughput
                        </CardTitle>
                        <CardDescription>
                            Job activity across all queues (3s refresh)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-[300px] w-full">
                            <AreaChart data={history}>
                                <defs>
                                    <linearGradient id="fillActive" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-active)" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="var(--color-active)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis
                                    dataKey="time"
                                    axisLine={false}
                                    tickLine={false}
                                    tickMargin={10}
                                    style={{ fontSize: '10px' }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    style={{ fontSize: '10px' }}
                                />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Area
                                    type="monotone"
                                    dataKey="active"
                                    stroke="var(--color-active)"
                                    fillOpacity={1}
                                    fill="url(#fillActive)"
                                    strokeWidth={2}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="waiting"
                                    stroke="var(--color-waiting)"
                                    fill="transparent"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                />
                            </AreaChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Active Schedules</CardTitle>
                        <CardDescription>
                            Repeatable jobs
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {!data || data.queues.flatMap(q => q.repeatableJobs).length === 0 ? (
                                <div className="text-center py-6 text-muted-foreground text-sm">
                                    No scheduled jobs found
                                </div>
                            ) : (
                                data.queues.flatMap(q => q.repeatableJobs).map((job) => (
                                    <div key={job.key} className="flex items-center justify-between group p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{job.name}</span>
                                            <code className="text-[10px] text-muted-foreground bg-muted px-1 rounded w-fit">
                                                {job.cron}
                                            </code>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] text-muted-foreground block">Next Run</span>
                                            <span className="text-[10px] font-mono">
                                                {new Date(job.next).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Queue Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Queue Name</th>
                                    <th className="px-4 py-3 font-medium">Active</th>
                                    <th className="px-4 py-3 font-medium">Waiting</th>
                                    <th className="px-4 py-3 font-medium">Delayed</th>
                                    <th className="px-4 py-3 font-medium">Scheduled</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {data?.queues.map((queue) => (
                                    <tr key={queue.name} className="hover:bg-muted/30">
                                        <td className="px-4 py-3 font-medium capitalize">{queue.name}</td>
                                        <td className="px-4 py-3">{queue.active}</td>
                                        <td className="px-4 py-3">{queue.waiting}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{queue.delayed}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{queue.scheduledCount}</td>
                                        <td className="px-4 py-3">
                                            {queue.isPaused ? (
                                                <Badge variant="outline" className="text-orange-500 border-orange-200">Paused</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-green-500 border-green-200">Processing</Badge>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function StatCard({
    title,
    value,
    icon,
    description,
    size = "default"
}: {
    title: string,
    value: number,
    icon: React.ReactNode,
    description: string,
    size?: "default" | "sm"
}) {
    const isSm = size === "sm";

    return (
        <Card className={`overflow-hidden transition-all hover:bg-muted/20 ${isSm ? 'p-0 shadow-none border-dashed' : ''}`}>
            <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${isSm ? 'p-3 pb-1' : 'pb-2'}`}>
                <CardTitle className={`font-medium ${isSm ? 'text-[10px]' : 'text-sm'}`}>{title}</CardTitle>
                <div className={isSm ? 'scale-75' : ''}>{icon}</div>
            </CardHeader>
            <CardContent className={isSm ? 'p-3 pt-0' : ''}>
                <div className={`${isSm ? 'text-lg' : 'text-2xl'} font-bold tabular-nums`}>
                    {value.toLocaleString()}
                </div>
                {!isSm && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
