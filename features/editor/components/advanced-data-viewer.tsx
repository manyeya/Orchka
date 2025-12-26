"use client";

import { memo, useState, useCallback, useMemo } from "react";
import {
    UncontrolledTreeEnvironment,
    Tree,
    StaticTreeDataProvider,
    TreeItem,
    TreeItemIndex,
} from "react-complex-tree";
import "react-complex-tree/lib/style-modern.css";
import JsonView from "@uiw/react-json-view";
import { ScrollArea } from "@/components/ui/scroll-area";
import { logger } from "@/lib/logger";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    TreesIcon,
    CodeIcon,
    TableIcon,
    CopyIcon,
    CheckIcon,
    ChevronDownIcon,
    ChevronRightIcon,
} from "lucide-react";

type ViewMode = "tree" | "json" | "table";

interface AdvancedDataViewerProps {
    data: unknown;
    emptyMessage?: string;
    defaultView?: ViewMode;
    showViewToggle?: boolean;
    maxHeight?: string;
}

/**
 * Get the count of items in data
 */
function getItemCount(data: unknown): number | null {
    if (Array.isArray(data)) {
        return data.length;
    }
    if (data && typeof data === "object") {
        return Object.keys(data).length;
    }
    return null;
}

/**
 * Check if data can be displayed as a table (array of objects)
 */
function isTableCompatible(data: unknown): boolean {
    if (!Array.isArray(data) || data.length === 0) return false;
    return data.every(
        (item) => item && typeof item === "object" && !Array.isArray(item)
    );
}

/**
 * Get all unique keys from an array of objects
 */
function getTableColumns(data: unknown[]): string[] {
    const keys = new Set<string>();
    data.forEach((item) => {
        if (item && typeof item === "object") {
            Object.keys(item).forEach((key) => keys.add(key));
        }
    });
    return Array.from(keys);
}

/**
 * Format a cell value for table display
 */
function formatCellValue(value: unknown): string {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
}

interface TreeItemData {
    key: string;
    value?: unknown;
    type: "string" | "number" | "boolean" | "null" | "undefined" | "array" | "object";
    count?: number;
}

/**
 * Convert arbitrary data to react-complex-tree format with type info for syntax highlighting
 */
function convertToTreeItems(
    data: unknown
): Record<TreeItemIndex, TreeItem<TreeItemData>> {
    const items: Record<TreeItemIndex, TreeItem<TreeItemData>> = {};

    const processValue = (
        value: unknown,
        key: string,
        path: string
    ): TreeItemIndex[] => {
        const itemId = path;

        if (value === null) {
            items[itemId] = {
                index: itemId,
                data: { key, value: null, type: "null" },
                children: [],
                isFolder: false,
            };
            return [itemId];
        }

        if (value === undefined) {
            items[itemId] = {
                index: itemId,
                data: { key, value: undefined, type: "undefined" },
                children: [],
                isFolder: false,
            };
            return [itemId];
        }

        if (Array.isArray(value)) {
            const childIds: TreeItemIndex[] = [];
            value.forEach((item, index) => {
                const childPath = `${path}[${index}]`;
                const childKeys = processValue(item, `[${index}]`, childPath);
                childIds.push(...childKeys);
            });
            items[itemId] = {
                index: itemId,
                data: { key, type: "array", count: value.length },
                children: childIds,
                isFolder: true,
            };
            return [itemId];
        }

        if (typeof value === "object") {
            const childIds: TreeItemIndex[] = [];
            Object.entries(value as Record<string, unknown>).forEach(
                ([k, v]) => {
                    const childPath = `${path}.${k}`;
                    const childKeys = processValue(v, k, childPath);
                    childIds.push(...childKeys);
                }
            );
            items[itemId] = {
                index: itemId,
                data: { key, type: "object", count: Object.keys(value as object).length },
                children: childIds,
                isFolder: true,
            };
            return [itemId];
        }

        // Primitive values
        const type = typeof value as "string" | "number" | "boolean";
        items[itemId] = {
            index: itemId,
            data: { key, value, type },
            children: [],
            isFolder: false,
        };
        return [itemId];
    };

    // Process root
    if (data === null || data === undefined) {
        items.root = {
            index: "root",
            data: { key: "root", value: data, type: data === null ? "null" : "undefined" },
            children: [],
            isFolder: false,
        };
    } else if (Array.isArray(data)) {
        const childIds: TreeItemIndex[] = [];
        data.forEach((item, index) => {
            const childPath = `root[${index}]`;
            const childKeys = processValue(item, `[${index}]`, childPath);
            childIds.push(...childKeys);
        });
        items.root = {
            index: "root",
            data: { key: "root", type: "array", count: data.length },
            children: childIds,
            isFolder: true,
        };
    } else if (typeof data === "object") {
        const childIds: TreeItemIndex[] = [];
        Object.entries(data as Record<string, unknown>).forEach(([k, v]) => {
            const childPath = `root.${k}`;
            const childKeys = processValue(v, k, childPath);
            childIds.push(...childKeys);
        });
        items.root = {
            index: "root",
            data: { key: "root", type: "object", count: Object.keys(data as object).length },
            children: childIds,
            isFolder: true,
        };
    } else {
        const type = typeof data as "string" | "number" | "boolean";
        items.root = {
            index: "root",
            data: { key: "root", value: data, type },
            children: [],
            isFolder: false,
        };
    }

    return items;
}

/**
 * Render syntax-highlighted tree item
 */
function renderTreeItemTitle(itemData: TreeItemData): React.ReactElement {
    const { key, value, type, count } = itemData;

    // Color classes matching common JSON syntax highlighting
    const keyClass = "text-foreground";
    const stringClass = "text-green-400";
    const numberClass = "text-orange-400";
    const booleanClass = "text-purple-400";
    const nullClass = "text-muted-foreground italic";
    const bracketClass = "text-muted-foreground";

    if (type === "array") {
        return (
            <span className="truncate">
                <span className={keyClass}>{key}</span>
                <span className={bracketClass}> [{count}]</span>
            </span>
        );
    }

    if (type === "object") {
        return (
            <span className="truncate">
                <span className={keyClass}>{key}</span>
                <span className={bracketClass}> {`{${count}}`}</span>
            </span>
        );
    }

    if (type === "null") {
        return (
            <span className="truncate">
                <span className={keyClass}>{key}</span>
                <span className={bracketClass}>: </span>
                <span className={nullClass}>null</span>
            </span>
        );
    }

    if (type === "undefined") {
        return (
            <span className="truncate">
                <span className={keyClass}>{key}</span>
                <span className={bracketClass}>: </span>
                <span className={nullClass}>undefined</span>
            </span>
        );
    }

    if (type === "string") {
        let displayValue = String(value);
        if (displayValue.length > 80) {
            displayValue = displayValue.slice(0, 80) + "…";
        }
        return (
            <span className="truncate">
                <span className={keyClass}>{key}</span>
                <span className={bracketClass}>: </span>
                <span className={stringClass}>"{displayValue}"</span>
            </span>
        );
    }

    if (type === "number") {
        return (
            <span className="truncate">
                <span className={keyClass}>{key}</span>
                <span className={bracketClass}>: </span>
                <span className={numberClass}>{String(value)}</span>
            </span>
        );
    }

    if (type === "boolean") {
        return (
            <span className="truncate">
                <span className={keyClass}>{key}</span>
                <span className={bracketClass}>: </span>
                <span className={booleanClass}>{String(value)}</span>
            </span>
        );
    }

    return <span>{key}: {String(value)}</span>;
}

/**
 * Tree View Component using react-complex-tree
 */
const TreeViewPanel = memo(
    ({ data, collapsed }: { data: unknown; collapsed: boolean }) => {
        const treeItems = useMemo(() => convertToTreeItems(data), [data]);

        const dataProvider = useMemo(
            () => new StaticTreeDataProvider(treeItems),
            [treeItems]
        );

        const expandedItems = useMemo(() => {
            if (collapsed) return [];
            return Object.keys(treeItems).filter(
                (key) => treeItems[key].isFolder
            );
        }, [treeItems, collapsed]);

        return (
            <div className="rct-tree-container p-4 text-xs font-mono">
                <style>{`
                    .rct-tree-container {
                        --rct-color-tree-bg: transparent;
                        --rct-color-tree-focus-outline: transparent;
                        --rct-color-focustree-item-selected-bg: var(--accent);
                        --rct-color-focustree-item-selected-text: var(--foreground);
                        --rct-color-focustree-item-hover-bg: var(--muted);
                        --rct-color-focustree-item-hover-text: var(--foreground);
                        --rct-color-focustree-item-active-bg: var(--accent);
                        --rct-color-focustree-item-active-text: var(--foreground);
                        --rct-color-focustree-item-focused-border: var(--border);
                        --rct-color-nonfocustree-item-selected-bg: var(--muted);
                        --rct-color-nonfocustree-item-selected-text: var(--foreground);
                        --rct-color-nonfocustree-item-focused-border: var(--border);
                        --rct-color-arrow: var(--muted-foreground);
                        --rct-color-drag-between-line-bg: var(--primary);
                        --rct-color-search-highlight-bg: var(--muted);
                        --rct-bar-color: var(--primary);
                        --rct-focus-outline: transparent;
                        --rct-item-height: 24px;
                        --rct-item-padding: 6px;
                        --rct-radius: 0px;
                        --rct-cursor: pointer;
                        --rct-arrow-size: 12px;
                    }
                    .rct-tree-container .rct-tree-item-button {
                        font-family: var(--font-mono);
                        font-size: 12px;
                        max-width: 100%;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }
                    .rct-tree-container .rct-tree-item-li {
                        max-width: 100%;
                    }
                `}</style>
                <UncontrolledTreeEnvironment<TreeItemData>
                    key={collapsed ? "collapsed" : "expanded"}
                    dataProvider={dataProvider}
                    getItemTitle={(item) => item.data.key}
                    renderItemTitle={({ item }) => renderTreeItemTitle(item.data)}
                    viewState={{
                        "data-tree": {
                            expandedItems,
                        },
                    }}
                >
                    <Tree
                        treeId="data-tree"
                        rootItem="root"
                        treeLabel="Data Tree"
                    />
                </UncontrolledTreeEnvironment>
            </div>
        );
    }
);
TreeViewPanel.displayName = "TreeViewPanel";

/**
 * JSON View Component with syntax highlighting
 */
const JsonViewPanel = memo(({ data }: { data: unknown }) => {
    return (
        <div className="p-4 bg-muted/5 min-h-full">
            <JsonView
                value={data as object}
                style={{
                    "--w-rjv-background-color": "transparent",
                    "--w-rjv-color": "var(--foreground)",
                    "--w-rjv-key-string": "var(--primary)",
                    "--w-rjv-type-string-color": "oklch(0.75 0.12 160)",
                    "--w-rjv-type-int-color": "oklch(0.75 0.12 260)",
                    "--w-rjv-type-boolean-color": "oklch(0.75 0.12 300)",
                    "--w-rjv-brackets-color": "var(--muted-foreground)",
                    "--w-rjv-arrow-color": "var(--muted-foreground)",
                    "--w-rjv-border-left": "1px solid var(--border)",
                    "--w-rjv-line-color": "var(--border)",
                    "--w-rjv-font-family": "var(--font-mono)",
                    fontSize: "12px",
                }}
                displayDataTypes={false}
                displayObjectSize={true}
                shortenTextAfterLength={100}
                enableClipboard
            />
        </div>
    );
});
JsonViewPanel.displayName = "JsonViewPanel";

/**
 * Table View Component for array data
 */
const TableViewPanel = memo(({ data }: { data: unknown[] }) => {
    const columns = useMemo(() => getTableColumns(data), [data]);

    if (!isTableCompatible(data)) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-4">
                Table view is only available for arrays of objects.
            </div>
        );
    }

    return (
        <div className="p-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        {columns.map((col) => (
                            <TableHead key={col} className="font-mono text-xs">
                                {col}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.slice(0, 100).map((item, index) => (
                        <TableRow key={index}>
                            <TableCell className="text-muted-foreground">
                                {index}
                            </TableCell>
                            {columns.map((col) => (
                                <TableCell
                                    key={col}
                                    className="font-mono text-xs max-w-[200px] truncate"
                                    title={formatCellValue(
                                        (item as Record<string, unknown>)[col]
                                    )}
                                >
                                    {formatCellValue(
                                        (item as Record<string, unknown>)[col]
                                    )}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {data.length > 100 && (
                <div className="text-center text-muted-foreground text-xs mt-4">
                    Showing first 100 of {data.length} items
                </div>
            )}
        </div>
    );
});
TableViewPanel.displayName = "TableViewPanel";

/**
 * Advanced Data Viewer Component
 *
 * Features:
 * - Multiple view modes: Tree, JSON (syntax highlighted), Table
 * - Copy to clipboard functionality
 * - Expand/collapse all for tree view
 * - Item count badge
 * - Dark theme integration
 */
export const AdvancedDataViewer = memo(
    ({
        data,
        emptyMessage = "No data available",
        defaultView = "tree",
        showViewToggle = true,
    }: AdvancedDataViewerProps) => {
        const [viewMode, setViewMode] = useState<ViewMode>(defaultView);
        const [copied, setCopied] = useState(false);
        const [collapsed, setCollapsed] = useState(false);

        const itemCount = useMemo(() => getItemCount(data), [data]);
        const canShowTable = useMemo(
            () => Array.isArray(data),
            [data]
        );

        const handleCopy = useCallback(async () => {
            try {
                await navigator.clipboard.writeText(
                    JSON.stringify(data, null, 2)
                );
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (error) {
                logger.error({ err: error }, "Failed to copy:");
            }
        }, [data]);

        const toggleCollapse = useCallback(() => {
            setCollapsed((prev) => !prev);
        }, []);

        // Empty state
        if (data === null || data === undefined) {
            return (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-4 text-center">
                    {emptyMessage}
                </div>
            );
        }

        return (
            <div className="h-full flex flex-col overflow-hidden">
                {/* Toolbar */}
                <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/20 shrink-0">
                    <div className="flex items-center gap-2">
                        {showViewToggle && (
                            <ToggleGroup
                                type="single"
                                value={viewMode}
                                onValueChange={(value) =>
                                    value && setViewMode(value as ViewMode)
                                }
                                size="sm"
                            >
                                <ToggleGroupItem
                                    value="tree"
                                    aria-label="Tree view"
                                    title="Tree View"
                                >
                                    <TreesIcon className="h-3.5 w-3.5" />
                                </ToggleGroupItem>
                                <ToggleGroupItem
                                    value="json"
                                    aria-label="JSON view"
                                    title="JSON View"
                                >
                                    <CodeIcon className="h-3.5 w-3.5" />
                                </ToggleGroupItem>
                                {canShowTable && (
                                    <ToggleGroupItem
                                        value="table"
                                        aria-label="Table view"
                                        title="Table View"
                                    >
                                        <TableIcon className="h-3.5 w-3.5" />
                                    </ToggleGroupItem>
                                )}
                            </ToggleGroup>
                        )}

                        {itemCount !== null && (
                            <Badge className="text-xs bg-primary text-primary-foreground">
                                {itemCount} {itemCount === 1 ? "item" : "items"}
                            </Badge>
                        )}
                    </div>

                    <div className="flex items-center gap-1">
                        {viewMode === "tree" && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleCollapse}
                                className="h-7 px-2 text-xs"
                            >
                                {collapsed ? (
                                    <>
                                        <ChevronRightIcon className="h-3.5 w-3.5 mr-1" />
                                        Expand
                                    </>
                                ) : (
                                    <>
                                        <ChevronDownIcon className="h-3.5 w-3.5 mr-1" />
                                        Collapse
                                    </>
                                )}
                            </Button>
                        )}

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopy}
                            className="h-7 px-2"
                        >
                            {copied ? (
                                <CheckIcon className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                                <CopyIcon className="h-3.5 w-3.5" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* Content - flex-1 with min-h-0 allows proper scrolling */}
                <div className="flex-1 min-h-0">
                    <ScrollArea className="h-full">
                        {viewMode === "tree" && (
                            <TreeViewPanel data={data} collapsed={collapsed} />
                        )}
                        {viewMode === "json" && <JsonViewPanel data={data} />}
                        {viewMode === "table" && canShowTable && (
                            <TableViewPanel data={data as unknown[]} />
                        )}
                    </ScrollArea>
                </div>
            </div>
        );
    }
);
AdvancedDataViewer.displayName = "AdvancedDataViewer";
