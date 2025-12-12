'use client';
import { ErrorView, LoadingView } from '@/components/entity-component';
import { NODE_COMPONENTS, NodeType } from '@/config/node-components';
import { useSuspenseWorkflow } from '@/features/workflows/hooks/use-workflows';
import { ReactFlow, Background, Panel } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useEffect, useMemo } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { nodesAtom, edgesAtom, onNodesChangeAtom, onEdgesChangeAtom, onConnectAtom, loadWorkflowAtom } from '../store';
import { AddNodeButton } from './add-node-button';
import { ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { SettingsPanel } from './settings-panel';
import { SettingsPortalContext } from './settings-context';
import { useState } from 'react';
import { ExecuteWorkflowButton } from './execute-workflow-butto';

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
    const nodes = useAtomValue(nodesAtom);
    const edges = useAtomValue(edgesAtom,);
    const onNodesChange = useSetAtom(onNodesChangeAtom);
    const onEdgesChange = useSetAtom(onEdgesChangeAtom);
    const onConnect = useSetAtom(onConnectAtom);
    const loadWorkflow = useSetAtom(loadWorkflowAtom);

    const hasManualTriggerNode = useMemo(() => nodes.some(node => node.type === NodeType.MANUAL_TRIGGER), [nodes]);
    // Load workflow data when component mounts or workflow changes
    useEffect(() => {
        if (workflow.nodes && workflow.edges) {
            loadWorkflow({ nodes: workflow.nodes, edges: workflow.edges });
        }
    }, [workflow.nodes, workflow.edges, loadWorkflow]);

    // Portal container state
    const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <SettingsPortalContext.Provider value={portalContainer}>
                <ResizablePanelGroup direction="horizontal">
                    <ResizablePanel defaultSize={100} minSize={30}>
                        <ReactFlow nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            proOptions={{ hideAttribution: true }}
                            nodeTypes={NODE_COMPONENTS}
                            defaultEdgeOptions={{
                                animated: true,
                                style: { stroke: 'var(--primary)' },
                            }}
                            connectionLineStyle={{ stroke: 'var(--primary)', strokeWidth: 2 }}
                            snapToGrid
                            snapGrid={[10, 10]}
                            fitView>
                            <Background gap={20} />
                            <Panel position="top-left">
                                <AddNodeButton />
                            </Panel>
                            {hasManualTriggerNode && (
                                <Panel position="bottom-center">
                                    <ExecuteWorkflowButton workflowId={workflowId} />
                                </Panel>
                            )}
                        </ReactFlow>
                    </ResizablePanel>
                    <SettingsPanel setContainer={setPortalContainer} />
                </ResizablePanelGroup>
            </SettingsPortalContext.Provider>
        </div>
    )
}

export default Editor