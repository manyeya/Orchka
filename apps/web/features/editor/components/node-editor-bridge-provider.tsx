"use client";

import { useMemo, type ReactNode } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useQuery } from "@tanstack/react-query";
import type { CredentialType } from "@orchka/credentials-core/types";
import {
  NodeEditorBridgeProvider as NodesEditorBridgeProvider,
  type CredentialOptionsResult,
} from "@orchka/nodes/editor";

import { useTRPC } from "@/trpc/client";
import {
  activeNodeModalIdAtom,
  deleteNodeAtom,
  nodeExecutionDataAtom,
  nodeIterationAtom,
  nodesAtom,
  nodeStatusesAtom,
  updateNodeAtom,
} from "../store";
import { NodeSelector } from "./node-selector";

function useBridgeCredentialsByType(type: CredentialType): CredentialOptionsResult {
  const trpc = useTRPC();
  const { data, isLoading, error } = useQuery(
    trpc.credentials.list.queryOptions({ type }),
  );

  return {
    items: data?.items ?? [],
    isLoading,
    error: error instanceof Error ? error : error ? new Error(String(error)) : null,
  };
}

export function NodeEditorBridgeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const nodes = useAtomValue(nodesAtom);
  const activeNodeModalId = useAtomValue(activeNodeModalIdAtom);
  const nodeStatuses = useAtomValue(nodeStatusesAtom);
  const nodeExecutionData = useAtomValue(nodeExecutionDataAtom);
  const nodeIterations = useAtomValue(nodeIterationAtom);
  const setActiveNodeModalId = useSetAtom(activeNodeModalIdAtom);
  const updateNode = useSetAtom(updateNodeAtom);
  const deleteNode = useSetAtom(deleteNodeAtom);

  const bridgeValue = useMemo(
    () => ({
      nodes,
      activeNodeModalId,
      setActiveNodeModalId,
      updateNode,
      deleteNode,
      nodeStatuses,
      nodeExecutionData,
      nodeIterations,
      useCredentialsByType: useBridgeCredentialsByType,
      NodeSelector,
    }),
    [
      activeNodeModalId,
      deleteNode,
      nodeExecutionData,
      nodeIterations,
      nodeStatuses,
      nodes,
      setActiveNodeModalId,
      updateNode,
    ],
  );

  return (
    <NodesEditorBridgeProvider value={bridgeValue}>
      {children}
    </NodesEditorBridgeProvider>
  );
}
