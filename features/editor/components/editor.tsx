'use client';

import { ErrorView, LoadingView } from '@/components/entity-component';
import { NODE_COMPONENTS, NodeType } from '@/config/node-components';
import { useSuspenseWorkflow } from '@/features/workflows/hooks/use-workflows';
import { ReactFlow, Background, Panel, ConnectionLineType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useEffect, useMemo } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { nodesAtom, edgesAtom, onNodesChangeAtom, onEdgesChangeAtom, onConnectAtom, loadWorkflowAtom } from '../store';
import { AddNodeButton } from './add-node-button';
import { ExecuteWorkflowButton } from './execute-workflow-butto';
import { resolveCollisions } from '../utils/resolve-collisions';
import { GroupButton } from './group-button';

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
    const setNodes = useSetAtom(nodesAtom);
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

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <ReactFlow nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}

                onNodeDrag={(_, node) => {
                    // Ignore Group nodes for collision updates (they shouldn't push things while being dragged)
                    if (node.type === NodeType.GROUP) return;

                    // Create a temporary list of nodes with the current dragged node updated
                    const updatedNodes = nodes.map((n) => (n.id === node.id ? node : n));

                    // Filter out groups from collision resolution targets
                    const collisionNodes = updatedNodes.filter(n => n.type !== NodeType.GROUP);

                    // Resolve collisions
                    const resolvedCollisionNodes = resolveCollisions(collisionNodes, {
                        maxIterations: 10,
                        overlapThreshold: 5,
                        margin: 24
                    });

                    // Merge back: Keep groups as they were, update non-groups from result
                    const finalNodes = nodes.map(n => {
                        if (n.type === NodeType.GROUP) return n;
                        const resolved = resolvedCollisionNodes.find(rn => rn.id === n.id);
                        return resolved || n;
                    });

                    setNodes(finalNodes);
                }}
                onNodeDragStop={(_, node) => {
                    // Calculate absolute position of the dragged node
                    const parentNode = node.parentId ? nodes.find(n => n.id === node.parentId) : null;
                    const nodeAbsPos = {
                        x: node.position.x + (parentNode?.position.x ?? 0),
                        y: node.position.y + (parentNode?.position.y ?? 0),
                    };

                    const groupNode = nodes.find(n => n.type === NodeType.GROUP && n.id !== node.id &&
                        nodeAbsPos.x >= n.position.x &&
                        nodeAbsPos.x + (node.measured?.width || 0) <= n.position.x + (n.measured?.width || 0) &&
                        nodeAbsPos.y >= n.position.y &&
                        nodeAbsPos.y + (node.measured?.height || 0) <= n.position.y + (n.measured?.height || 0)
                    );

                    // Check if we need to change the Group
                    if (groupNode && node.parentId !== groupNode.id) {
                        // Enter Group
                        const newNodes = nodes.map(n => {
                            if (n.id === node.id) {
                                return {
                                    ...n,
                                    parentId: groupNode.id,
                                    extent: undefined,
                                    position: {
                                        x: nodeAbsPos.x - groupNode.position.x,
                                        y: nodeAbsPos.y - groupNode.position.y
                                    }
                                };
                            }
                            return n;
                        }).sort((a, b) => {
                            if (a.type === NodeType.GROUP && b.type !== NodeType.GROUP) return -1;
                            if (a.type !== NodeType.GROUP && b.type === NodeType.GROUP) return 1;
                            return 0;
                        });

                        const resolvedNodes = resolveCollisions(newNodes, { maxIterations: 10, overlapThreshold: 5, margin: 5 });
                        setNodes(resolvedNodes);

                    } else if (!groupNode && node.parentId) {
                        // Leave Group
                        const parent = nodes.find(n => n.id === node.parentId);
                        if (parent) {
                            const newNodes = nodes.map(n => {
                                if (n.id === node.id) {
                                    return {
                                        ...n,
                                        parentId: undefined,
                                        extent: undefined,
                                        position: {
                                            x: nodeAbsPos.x,
                                            y: nodeAbsPos.y
                                        }
                                    };
                                }
                                return n;
                            }).sort((a, b) => {
                                if (a.type === NodeType.GROUP && b.type !== NodeType.GROUP) return -1;
                                if (a.type !== NodeType.GROUP && b.type === NodeType.GROUP) return 1;
                                return 0;
                            });
                            const resolvedNodes = resolveCollisions(newNodes, { maxIterations: 10, overlapThreshold: 5, margin: 10 });
                            setNodes(resolvedNodes);
                        }
                    }
                }}
                proOptions={{ hideAttribution: true }}
                nodeTypes={NODE_COMPONENTS}
                defaultEdgeOptions={{
                    animated: true,
                    style: { stroke: 'var(--primary)' },
                    type: 'step',
                }}
                connectionLineStyle={{ stroke: 'var(--primary)', strokeWidth: 2 }}
                connectionLineType={ConnectionLineType.Step}
                snapToGrid
                snapGrid={[20, 20]}
                fitView>
                <Background gap={20} />
                <Panel className='flex flex-col gap-2' position="top-left">
                    <AddNodeButton />
                    <GroupButton />
                </Panel>
                {hasManualTriggerNode && (
                    <Panel position="bottom-center">
                        <ExecuteWorkflowButton workflowId={workflowId} />
                    </Panel>
                )}
            </ReactFlow>
        </div>
    )
}

export default Editor