'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { logger } from "@/lib/logger";
import {
    Save,
    Undo,
    Redo,
    Download,
    Upload,
    AlertTriangle,
    CheckCircle,
    Info,
    Check
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    TooltipProvider,
} from '@/components/ui/tooltip';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { AppTooltip } from '@/components/entity-component';
import { useAtomValue, useSetAtom } from 'jotai';
import {
    isDirtyAtom,
    canUndoAtom,
    canRedoAtom,
    undoAtom,
    redoAtom,
    markCleanAtom,
    exportWorkflowAtom,
    importWorkflowAtom,
    validateGraphAtom,
    validationResultAtom,
    nodesAtom,
    edgesAtom,
} from '../store';
import EditorBreadcrum from './editor-breadcrum';
import { useUpdateWorkflow } from '@/features/workflows/hooks/use-workflows';

interface EditorHeaderProps {
    workflowId: string;
}

export function EditorHeader({
    workflowId,
}: EditorHeaderProps) {
    // Read-only state
    const isDirty = useAtomValue(isDirtyAtom);
    const canUndo = useAtomValue(canUndoAtom);
    const canRedo = useAtomValue(canRedoAtom);
    const validationResult = useAtomValue(validationResultAtom);
    const nodes = useAtomValue(nodesAtom);
    const edges = useAtomValue(edgesAtom);

    // Actions
    const undo = useSetAtom(undoAtom);
    const redo = useSetAtom(redoAtom);
    const markClean = useSetAtom(markCleanAtom);
    const exportWorkflow = useSetAtom(exportWorkflowAtom);
    const importWorkflow = useSetAtom(importWorkflowAtom);
    const validateGraph = useSetAtom(validateGraphAtom);

    const [isImporting, setIsImporting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const updateWorkflow = useUpdateWorkflow();

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateWorkflow.mutateAsync({
                id: workflowId,
                nodes: nodes.map(node => ({
                    id: node.id,
                    type: node.type,
                    position: node.position,
                    data: node.data
                })),
                edges: edges.map(edge => ({
                    source: edge.source,
                    target: edge.target,
                    sourceHandle: edge.sourceHandle || "",
                    targetHandle: edge.targetHandle || ""
                }))
            });
            markClean();
        } catch (error) {
            logger.error({ err: error }, "Failed to save workflow");
        } finally {
            setIsSaving(false);
        }
    };

    const handleImport = async () => {
        setIsImporting(true);
        try {
            const result = await importWorkflow();
            if (result.success) {
                toast.success('Workflow imported successfully');
            } else {
                toast.error('Import failed', {
                    description: result.errors?.join(', ') || 'Unknown error occurred'
                });
            }
        } finally {
            setIsImporting(false);
        }
    };

    const handleExport = () => {
        const filename = `workflow-${workflowId}-${new Date().toISOString().split('T')[0]}.json`;
        exportWorkflow(filename);
    };

    const handleValidate = () => {
        validateGraph();
    };

    const getValidationIcon = () => {
        if (!validationResult) return null;

        if (!validationResult.isValid) {
            return <AlertTriangle className="w-4 h-4 text-red-500" strokeWidth={2} />;
        } else if (validationResult.warnings.length > 0) {
            return <Info className="w-4 h-4 text-amber-500" strokeWidth={2} />;
        } else {
            return <CheckCircle className="w-4 h-4 text-green-500" strokeWidth={2} />;
        }
    };

    return (
        <div className="flex items-center justify-between py-2 px-4 border-b border-border bg-background">
            <div className="flex items-center gap-2">
                <EditorBreadcrum workflowId={workflowId} />
                {isDirty && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-medium text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 border-amber-200 dark:border-amber-800">
                        Unsaved
                    </Badge>
                )}
            </div>

            <TooltipProvider>
                <div className="flex items-center gap-1 ">
                    {/* History Controls */}
                    <div className="flex items-center gap-1">
                        <AppTooltip content="Undo (Ctrl+Z)">
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={undo}
                                disabled={!canUndo}
                                className="h-8 w-8"
                            >
                                <Undo className="w-4 h-4" />
                            </Button>
                        </AppTooltip>
                        <AppTooltip content="Redo (Ctrl+Y)">
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={redo}
                                disabled={!canRedo}
                                className="h-8 w-8"
                            >
                                <Redo className="w-4 h-4" />
                            </Button>
                        </AppTooltip>
                    </div>

                    <Separator orientation="vertical" className="h-6! mx-2 bg-border" />

                    {/* Import/Export */}
                    <div className="flex items-center gap-1">
                        <AppTooltip content={isImporting ? 'Importing...' : 'Import workflow'}>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={handleImport}
                                disabled={isImporting}
                                className="h-8 w-8"
                            >
                                <Upload className="w-4 h-4" />
                            </Button>
                        </AppTooltip>
                        <AppTooltip content="Export workflow">
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={handleExport}
                                className="h-8 w-8"
                            >
                                <Download className="w-4 h-4" />
                            </Button>
                        </AppTooltip>
                    </div>
                    <Separator orientation="vertical" className="h-6! mx-2 bg-border" />
                    {/* Validation */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={handleValidate}
                                className="h-8 w-8"
                            >
                                {getValidationIcon() || <Check className="w-4 h-4" />}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="end">
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-sm">Workflow Validation</h4>
                                    <p className="text-xs text-muted-foreground">
                                        {!validationResult
                                            ? 'Click the button to validate your workflow'
                                            : validationResult.isValid
                                                ? 'Your workflow is valid and ready to run'
                                                : 'Please fix the following issues'}
                                    </p>
                                </div>

                                {validationResult && validationResult.errors.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 text-red-500" />
                                            <span className="text-sm font-medium text-red-500">
                                                Errors ({validationResult.errors.length})
                                            </span>
                                        </div>
                                        <ul className="space-y-1 text-xs">
                                            {validationResult.errors.map((error, index) => (
                                                <li key={index} className="flex items-start gap-2 text-red-600 dark:text-red-400">
                                                    <span className="mt-0.5">•</span>
                                                    <span>{error.message}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {validationResult && validationResult.warnings.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Info className="w-4 h-4 text-amber-500" />
                                            <span className="text-sm font-medium text-amber-600 dark:text-amber-500">
                                                Warnings ({validationResult.warnings.length})
                                            </span>
                                        </div>
                                        <ul className="space-y-1 text-xs">
                                            {validationResult.warnings.map((warning, index) => (
                                                <li key={index} className="flex items-start gap-2 text-amber-600 dark:text-amber-400">
                                                    <span className="mt-0.5">•</span>
                                                    <span>{warning.message}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {validationResult && validationResult.isValid && validationResult.warnings.length === 0 && (
                                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                        <CheckCircle className="w-4 h-4" />
                                        <span className="text-sm">No issues found</span>
                                    </div>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>



                    {/* Save */}
                    <AppTooltip content={isSaving ? 'Saving...' : isDirty ? 'Save changes' : 'No changes'}>
                        <Button
                            variant={isDirty ? "default" : "ghost"}
                            size="icon-lg"
                            onClick={handleSave}
                            disabled={!isDirty || isSaving}
                            className={`h-8 w-8 ${!isDirty ? "opacity-50" : ""}`}
                        >
                            <Save className="w-4 h-4" />
                        </Button>
                    </AppTooltip>
                </div>
            </TooltipProvider>
        </div>
    );
}