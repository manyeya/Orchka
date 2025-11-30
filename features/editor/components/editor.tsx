'use client';
import { ErrorView, LoadingView } from '@/components/entity-component';
import { nodeComponents } from '@/config/node-components';
import { useSuspenseWorkflow } from '@/features/workflows/hooks/use-workflows';
import { ReactFlow, type NodeChange, type EdgeChange, type Connection, Background, Controls, Panel } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useEffect } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { nodesAtom, edgesAtom, onNodesChangeAtom, onEdgesChangeAtom, onConnectAtom, loadWorkflowAtom } from '../store';
import { AddNodeButton } from './add-node-button';

export const EditorLoadingView = () => {
    return (
        <LoadingView entity="Editor" />
    )
}

export const EditorErrorView = () => {
    return (
        <ErrorView entity="Editor" />
    )
}

function Editor({ workflowId }: { workflowId: string }) {
    const { data: workflow } = useSuspenseWorkflow(workflowId)

    // Use Jotai atoms instead of local state
    const [nodes, setNodes] = useAtom(nodesAtom);
    const [edges, setEdges] = useAtom(edgesAtom);
    const onNodesChange = useSetAtom(onNodesChangeAtom);
    const onEdgesChange = useSetAtom(onEdgesChangeAtom);
    const onConnect = useSetAtom(onConnectAtom);
    const loadWorkflow = useSetAtom(loadWorkflowAtom);

    // Load workflow data when component mounts or workflow changes
    useEffect(() => {
        if (workflow.nodes && workflow.edges) {
            loadWorkflow({ nodes: workflow.nodes, edges: workflow.edges });
        }
    }, [workflow.nodes, workflow.edges, loadWorkflow]);

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <ReactFlow nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                proOptions={{ hideAttribution: true }}
                nodeTypes={nodeComponents}
                defaultEdgeOptions={{
                    animated: true,
                    style: { stroke: 'var(--primary)' },
                }}
                connectionLineStyle={{ stroke: 'var(--primary)', strokeWidth: 2 }}
                snapToGrid
                snapGrid={[10, 10]}
                fitView>
                <Background />
                <Controls />
                <Panel position="top-left">
                    <AddNodeButton />
                </Panel>
            </ReactFlow>
        </div>
    )
}

export default Editor