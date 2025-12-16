"use client";

import { memo } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from "@/components/ui/resizable";
import { useAtom } from "jotai";
import { activeNodeModalIdAtom, nodesAtom } from "@/features/editor/store";
import { useNodeExecutionData } from "@/features/nodes/utils/use-node-execution-data";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface NodeDetailModalProps {
    nodeId: string;
    nodeName: string;
    nodeIcon?: React.ReactNode;
    children: React.ReactNode; // The settings form
}

/**
 * Panel header component for consistent styling
 */
const PanelHeader = ({ title, className }: { title: string; className?: string }) => (
    <div className={cn("px-4 py-3 border-b bg-muted/30 font-medium text-sm", className)}>
        {title}
    </div>
);

/**
 * JSON data viewer component for input/output panels
 */
const JsonDataViewer = memo(({ data, emptyMessage }: { data: unknown; emptyMessage: string }) => {
    if (data === null || data === undefined) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                {emptyMessage}
            </div>
        );
    }

    return (
        <ScrollArea className="h-full">
            <pre className="p-4 text-xs font-mono whitespace-pre-wrap break-all">
                {JSON.stringify(data, null, 2)}
            </pre>
        </ScrollArea>
    );
});
JsonDataViewer.displayName = "JsonDataViewer";

/**
 * N8n-style node detail modal with resizable Input, Settings, and Output panels.
 * Opens when clicking on a node and displays:
 * - Left panel: Input data from previous nodes
 * - Center panel: Node settings form
 * - Right panel: Output data from this node's execution
 */
export const NodeDetailModal = memo(({
    nodeId,
    nodeName,
    nodeIcon,
    children,
}: NodeDetailModalProps) => {
    const [activeModalId, setActiveModalId] = useAtom(activeNodeModalIdAtom);
    const isOpen = activeModalId === nodeId;

    const { input, output, hasData } = useNodeExecutionData({ nodeId });

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setActiveModalId(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent
                className="!w-[95vw] !max-w-[1600px] h-[85vh] p-0 gap-0 flex flex-col overflow-hidden"
                showCloseButton={true}
            >
                <DialogHeader className="px-6 py-4 border-b shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        {nodeIcon}
                        <span>{nodeName}</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 min-h-0">
                    <ResizablePanelGroup direction="horizontal" className="h-full">
                        {/* Input Panel */}
                        <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
                            <div className="h-full flex flex-col">
                                <PanelHeader title="Input" />
                                <div className="flex-1 min-h-0">
                                    <JsonDataViewer
                                        data={input}
                                        emptyMessage="No input data. Execute the workflow to see input."
                                    />
                                </div>
                            </div>
                        </ResizablePanel>

                        <ResizableHandle withHandle />

                        {/* Settings Panel */}
                        <ResizablePanel defaultSize={50} minSize={30}>
                            <div className="h-full flex flex-col overflow-hidden">
                                <PanelHeader title="Settings" />
                                <div className="flex-1 min-h-0 overflow-auto">
                                    <div className="p-6">
                                        {children}
                                    </div>
                                </div>
                            </div>
                        </ResizablePanel>

                        <ResizableHandle withHandle />

                        {/* Output Panel */}
                        <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
                            <div className="h-full flex flex-col">
                                <PanelHeader title="Output" />
                                <div className="flex-1 min-h-0">
                                    <JsonDataViewer
                                        data={output}
                                        emptyMessage="No output data. Execute the workflow to see output."
                                    />
                                </div>
                            </div>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </div>
            </DialogContent>
        </Dialog>
    );
});
NodeDetailModal.displayName = "NodeDetailModal";
