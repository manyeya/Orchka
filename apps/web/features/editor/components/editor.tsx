'use client';

import { ErrorView, LoadingView } from '@/components/entity-component';
import { NodeType, isTriggerNode } from '@orchka/nodes/core';
import { NODE_COMPONENTS } from '@orchka/nodes/editor';
import { useSuspenseWorkflow } from '@/features/workflows/hooks/use-workflows';
import { ReactFlow, Background, Panel, ConnectionLineType, type OnConnectEnd, type ReactFlowInstance } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { createId } from '@paralleldrive/cuid2';
import { nodesAtom, edgesAtom, onNodesChangeAtom, onEdgesChangeAtom, onConnectAtom, loadWorkflowAtom, workflowIdAtom } from '../store';
import { generateUniqueNodeName, getNodeNames } from '../utils/graph-validation';
import { AddNodeButton } from './add-node-button';
import { ExecuteWorkflowButton } from './execute-workflow-butto';
import { resolveCollisions } from '../utils/resolve-collisions';
import { GroupButton } from './group-button';
import { NodeEditorBridgeProvider } from './node-editor-bridge-provider';
import { RealtimeManager } from './realtime-manager';
import { ConnectEndNodePicker, type ConnectEndPickerLeaf } from './connect-end-node-picker';

interface ConnectEndPickerState {
    screenX: number;
    screenY: number;
    sourceNodeId: string;
    sourceHandleId: string | null;
    handleType: 'source' | 'target';
}

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
    const setWorkflowId = useSetAtom(workflowIdAtom);

    const hasTriggerNode = useMemo(() => nodes.some(node => isTriggerNode(node.type as string)), [nodes]);

    const rfInstanceRef = useRef<ReactFlowInstance | null>(null);
    const [pickerState, setPickerState] = useState<ConnectEndPickerState | null>(null);

    const handleConnectEnd = useCallback<OnConnectEnd>((event, connectionState) => {
        if (connectionState.isValid) return;
        const fromNode = connectionState.fromNode;
        if (!fromNode) return;
        const point = 'changedTouches' in event && event.changedTouches.length > 0
            ? { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY }
            : { x: (event as MouseEvent).clientX, y: (event as MouseEvent).clientY };
        setPickerState({
            screenX: point.x,
            screenY: point.y,
            sourceNodeId: fromNode.id,
            sourceHandleId: connectionState.fromHandle?.id ?? null,
            handleType: (connectionState.fromHandle?.type as 'source' | 'target' | undefined) ?? 'source',
        });
    }, []);

    const handlePickerClose = useCallback(() => setPickerState(null), []);

    const handlePickerSelect = useCallback((leaf: ConnectEndPickerLeaf) => {
        const state = pickerState;
        const instance = rfInstanceRef.current;
        if (!state || !instance) {
            setPickerState(null);
            return;
        }

        const flowPosition = instance.screenToFlowPosition({
            x: state.screenX,
            y: state.screenY,
        });

        const newNodeId = createId();
        const currentNodes = nodes;
        const uniqueName = generateUniqueNodeName(leaf.label, getNodeNames(currentNodes));

        const newNode = {
            id: newNodeId,
            type: leaf.type,
            position: flowPosition,
            data: {
                label: leaf.label,
                name: uniqueName,
            },
        };

        setNodes([...currentNodes, newNode]);

        const connection = state.handleType === 'target'
            ? {
                source: newNodeId,
                sourceHandle: null,
                target: state.sourceNodeId,
                targetHandle: state.sourceHandleId,
            }
            : {
                source: state.sourceNodeId,
                sourceHandle: state.sourceHandleId,
                target: newNodeId,
                targetHandle: null,
            };

        onConnect(connection);
        setPickerState(null);
    }, [nodes, onConnect, pickerState, setNodes]);

    // Load workflow data when component mounts or workflow changes
    useEffect(() => {
        setWorkflowId(workflowId);
    }, [workflowId, setWorkflowId]);

    useEffect(() => {
        if (workflow.nodes && workflow.edges) {
            loadWorkflow({ nodes: workflow.nodes, edges: workflow.edges });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workflow.id, loadWorkflow]); // Use workflow.id as stable anchor instead of full nodes/edges arrays

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <RealtimeManager />
            <NodeEditorBridgeProvider>
            <ReactFlow nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onConnectEnd={handleConnectEnd}
                onInit={(instance) => { rfInstanceRef.current = instance; }}

                onNodeDrag={(_, node) => {
                    // Ignore Group nodes for collision updates (they shouldn't push things while being dragged)
                    if (node.type === NodeType.GROUP) return;

                    // Create a temporary list of nodes with the current dragged node updated
                    const updatedNodes = nodes.map((n) => (n.id === node.id ? node : n));

                    // Filter out groups from collision resolution targets
                    const collisionNodes = updatedNodes.filter(n => n.type !== NodeType.GROUP);

                    // Convert all collision nodes to absolute positions for the algorithm
                    const absoluteCollisionNodes = collisionNodes.map(n => {
                        if (!n.parentId) return n;
                        const parent = nodes.find(p => p.id === n.parentId);
                        if (!parent) return n;

                        return {
                            ...n,
                            position: {
                                x: n.position.x + parent.position.x,
                                y: n.position.y + parent.position.y
                            }
                        };
                    });

                    // Resolve collisions using absolute positions
                    const resolvedAbsoluteNodes = resolveCollisions(absoluteCollisionNodes, {
                        maxIterations: 10,
                        overlapThreshold: 5,
                        margin: 24
                    });

                    // Merge back and convert absolute positions back to relative for child nodes
                    const finalNodes = nodes.map(n => {
                        if (n.type === NodeType.GROUP) return n;

                        // Find the resolved node (which is in absolute coords)
                        const resolvedAbs = resolvedAbsoluteNodes.find(rn => rn.id === n.id);
                        if (!resolvedAbs) return n;

                        // If it's a child node, convert back to relative
                        if (n.parentId) {
                            const parent = nodes.find(p => p.id === n.parentId);
                            if (parent) {
                                return {
                                    ...n,
                                    position: {
                                        x: resolvedAbs.position.x - parent.position.x,
                                        y: resolvedAbs.position.y - parent.position.y
                                    },
                                    // Preserve these if they were changed
                                    width: resolvedAbs.width,
                                    height: resolvedAbs.height,
                                    measured: resolvedAbs.measured
                                };
                            }
                        }

                        // If top-level, use absolute position directly
                        return {
                            ...n,
                            position: resolvedAbs.position,
                            width: resolvedAbs.width,
                            height: resolvedAbs.height,
                            measured: resolvedAbs.measured
                        };
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
                minZoom={0.9}
                fitView>
                <Background gap={20} />
                <Panel className='flex flex-col gap-2' position="top-left">
                    <AddNodeButton />
                    <GroupButton />
                </Panel>
                {hasTriggerNode && (
                    <Panel position="bottom-center">
                        <ExecuteWorkflowButton workflowId={workflowId} />
                    </Panel>
                )}
            </ReactFlow>
            </NodeEditorBridgeProvider>
            {pickerState && (
                <ConnectEndNodePicker
                    position={{ x: pickerState.screenX, y: pickerState.screenY }}
                    onSelect={handlePickerSelect}
                    onClose={handlePickerClose}
                />
            )}
        </div>
    )
}

export default Editor
