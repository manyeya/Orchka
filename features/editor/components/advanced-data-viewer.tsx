"use client";

import { memo, useState, useCallback, useMemo } from "react";
import JsonView from "@uiw/react-json-view";
import { darkTheme } from "@uiw/react-json-view/dark";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { cn } from "@/lib/utils";

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

/**
 * Tree View Component using @uiw/react-json-view
 */
const TreeViewPanel = memo(
    ({ data, collapsed }: { data: unknown; collapsed: boolean }) => {
        return (
            <JsonView
                value={data as object}
                collapsed={collapsed ? 1 : false}
                displayDataTypes={false}
                displayObjectSize={true}
                enableClipboard={true}
                style={{
                    ...darkTheme,
                    backgroundColor: "transparent",
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    padding: "16px",
                }}
            />
        );
    }
);
TreeViewPanel.displayName = "TreeViewPanel";

/**
 * JSON View Component with syntax highlighting
 */
const JsonViewPanel = memo(({ data }: { data: unknown }) => {
    const jsonString = useMemo(
        () => JSON.stringify(data, null, 2),
        [data]
    );

    return (
        <SyntaxHighlighter
            language="json"
            style={oneDark}
            customStyle={{
                margin: 0,
                padding: "16px",
                background: "transparent",
                fontSize: "12px",
            }}
            wrapLongLines
        >
            {jsonString}
        </SyntaxHighlighter>
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
        maxHeight,
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
                console.error("Failed to copy:", error);
            }
        }, [data]);

        const toggleCollapse = useCallback(() => {
            setCollapsed((prev) => !prev);
        }, []);

        // Empty state
        if (data === null || data === undefined) {
            return (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-4">
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
                            <Badge variant="secondary" className="text-xs">
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
