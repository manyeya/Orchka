import { describe, it, expect } from "vitest";
import { computeReadyNodes, isWorkflowComplete, type DagEdge } from "./plan-next-nodes";

function depsFromEdges(edges: DagEdge[], allNodes: string[]): Map<string, string[]> {
  const deps = new Map<string, string[]>();
  for (const n of allNodes) deps.set(n, []);
  for (const e of edges) deps.set(e.toNodeId, [...(deps.get(e.toNodeId) || []), e.fromNodeId]);
  return deps;
}

describe("computeReadyNodes", () => {
  it("returns both branches of a fan-out as ready in parallel", () => {
    // 1 -> 2, 1 -> 3
    const edges: DagEdge[] = [
      { fromNodeId: "1", toNodeId: "2" },
      { fromNodeId: "1", toNodeId: "3" },
    ];
    const ready = computeReadyNodes({
      currentNodeId: "1",
      sortedNodeIds: ["1", "2", "3"],
      dependencies: depsFromEdges(edges, ["1", "2", "3"]),
      edges,
      completed: new Set(["1"]),
      skipped: new Set(),
    });
    expect(new Set(ready)).toEqual(new Set(["2", "3"]));
  });

  it("holds a diamond join until both parents complete (fan-in)", () => {
    // 1 -> 2, 1 -> 3, 2 -> 4, 3 -> 4
    const edges: DagEdge[] = [
      { fromNodeId: "1", toNodeId: "2" },
      { fromNodeId: "1", toNodeId: "3" },
      { fromNodeId: "2", toNodeId: "4" },
      { fromNodeId: "3", toNodeId: "4" },
    ];
    const deps = depsFromEdges(edges, ["1", "2", "3", "4"]);

    // Only node 2 done -> 4 not ready yet
    expect(
      computeReadyNodes({
        currentNodeId: "2",
        sortedNodeIds: ["1", "2", "3", "4"],
        dependencies: deps,
        edges,
        completed: new Set(["1", "2"]),
        skipped: new Set(),
      })
    ).not.toContain("4");

    // Both 2 and 3 done -> 4 ready
    expect(
      computeReadyNodes({
        currentNodeId: "3",
        sortedNodeIds: ["1", "2", "3", "4"],
        dependencies: deps,
        edges,
        completed: new Set(["1", "2", "3"]),
        skipped: new Set(),
      })
    ).toContain("4");
  });

  it("treats a skipped parent as satisfied so an IF-diamond join still runs", () => {
    // IF -> A -> M, IF -> B -> M, with B skipped (false branch not taken)
    const edges: DagEdge[] = [
      { fromNodeId: "IF", toNodeId: "A" },
      { fromNodeId: "IF", toNodeId: "B" },
      { fromNodeId: "A", toNodeId: "M" },
      { fromNodeId: "B", toNodeId: "M" },
    ];
    const ready = computeReadyNodes({
      currentNodeId: "A",
      sortedNodeIds: ["IF", "A", "B", "M"],
      dependencies: depsFromEdges(edges, ["IF", "A", "B", "M"]),
      edges,
      completed: new Set(["IF", "A"]),
      skipped: new Set(["B"]),
    });
    expect(ready).toContain("M");
  });

  it("does not mark a node ready when all its parents were skipped", () => {
    const edges: DagEdge[] = [{ fromNodeId: "B", toNodeId: "C" }];
    const ready = computeReadyNodes({
      currentNodeId: "B",
      sortedNodeIds: ["B", "C"],
      dependencies: depsFromEdges(edges, ["B", "C"]),
      edges,
      completed: new Set(),
      skipped: new Set(["B"]),
    });
    expect(ready).not.toContain("C");
  });

  it("prioritises direct children of the current node first (depth-first)", () => {
    // 1 -> 2 (current path), and an independent 0 -> 3 already unblocked
    const edges: DagEdge[] = [
      { fromNodeId: "1", toNodeId: "2" },
      { fromNodeId: "0", toNodeId: "3" },
    ];
    const ready = computeReadyNodes({
      currentNodeId: "1",
      sortedNodeIds: ["0", "1", "2", "3"],
      dependencies: depsFromEdges(edges, ["0", "1", "2", "3"]),
      edges,
      completed: new Set(["0", "1"]),
      skipped: new Set(),
    });
    expect(ready[0]).toBe("2"); // direct child first
    expect(new Set(ready)).toEqual(new Set(["2", "3"]));
  });
});

describe("isWorkflowComplete", () => {
  it("is complete only when every node is completed or skipped", () => {
    const nodes = ["1", "2", "3"];
    expect(isWorkflowComplete(nodes, new Set(["1", "2"]), new Set())).toBe(false);
    expect(isWorkflowComplete(nodes, new Set(["1", "2"]), new Set(["3"]))).toBe(true);
    expect(isWorkflowComplete(nodes, new Set(["1", "2", "3"]), new Set())).toBe(true);
  });
});
