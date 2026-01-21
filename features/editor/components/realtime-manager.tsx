'use client';

import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { workflowIdAtom, nodeStatusesAtom, nodeExecutionDataAtom, type NodeExecutionData } from '../store';
import { WorkflowNodeStatus } from '@/components/workflow-node';

/**
 * Central component to manage real-time updates via SSE.
 * Listens for all events related to the current workflow and updates global atoms.
 */
export function RealtimeManager() {
    const workflowId = useAtomValue(workflowIdAtom);
    const setNodeStatuses = useSetAtom(nodeStatusesAtom);
    const setNodeExecutionData = useSetAtom(nodeExecutionDataAtom);

    useEffect(() => {
        if (!workflowId) return;

        console.log(`[RealtimeManager] Connecting to SSE for workflow: ${workflowId}`);
        const eventSource = new EventSource(`/api/bullmq/stream/${workflowId}`);

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                const nodeId = data.nodeId;

                if (!nodeId) return;

                // 1. Update Node Status
                let status: WorkflowNodeStatus | null = null;

                if (data.type === 'node-status') {
                    status = data.status as WorkflowNodeStatus;
                } else if (data.type === 'node-completed') {
                    status = 'success';
                } else if (data.type === 'node-failed') {
                    status = 'error';
                }

                if (status) {
                    setNodeStatuses(prev => ({
                        ...prev,
                        [nodeId]: status
                    }));
                }

                // 2. Update Execution Data
                if (data.type === 'node-completed' || data.input !== undefined) {
                    const newData: NodeExecutionData = {
                        input: data.input,
                        output: data.output,
                        timestamp: Date.now(),
                    };

                    setNodeExecutionData(prev => ({
                        ...prev,
                        [nodeId]: newData
                    }));
                }
            } catch (error) {
                console.error('[RealtimeManager] SSE Error:', error);
            }
        };

        eventSource.onerror = (error) => {
            console.error('[RealtimeManager] Connection failed:', error);
            eventSource.close();
        };

        return () => {
            console.log(`[RealtimeManager] Closing SSE for workflow: ${workflowId}`);
            eventSource.close();
        };
    }, [workflowId, setNodeStatuses, setNodeExecutionData]);

    return null; // This component doesn't render anything
}
