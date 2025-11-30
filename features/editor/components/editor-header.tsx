'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
    Save,
    Undo,
    Redo,
    Download,
    Upload,
    Play,
    AlertTriangle,
    CheckCircle,
    Info,
    Rocket,
    History,
    Check
} from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    TooltipProvider,
} from '@/components/ui/tooltip';
import { AppTooltip } from '@/components/entity-component';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
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
    workflowContextAtom,
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

    // Read-write state
    const [workflowContext, setWorkflowContext] = useAtom(workflowContextAtom);

    // Actions
    const undo = useSetAtom(undoAtom);
    const redo = useSetAtom(redoAtom);
    const markClean = useSetAtom(markCleanAtom);
    const exportWorkflow = useSetAtom(exportWorkflowAtom);
    const importWorkflow = useSetAtom(importWorkflowAtom);
    const validateGraph = useSetAtom(validateGraphAtom);

    const [isImporting, setIsImporting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isTestRunning, setIsTestRunning] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [showPublishDialog, setShowPublishDialog] = useState(false);

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
            console.error("Failed to save workflow", error);
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

    const getValidationTooltip = () => {
        if (!validationResult) return 'Click to validate workflow';

        if (!validationResult.isValid) {
            return `${validationResult.errors.length} error(s) found`;
        } else if (validationResult.warnings.length > 0) {
            return `${validationResult.warnings.length} warning(s) found`;
        } else {
            return 'Workflow is valid';
        }
    };

    const handleTestRun = async () => {

    };

    const handlePublishClick = () => {

    };

    const handlePublishConfirm = async () => {

    };

    //   const getVersionBadge = () => {
    //     if (!workflowContext) return null;

    //     if (workflowContext.versionStatus === 'DRAFT') {
    //       return (
    //         <span className="inline-flex items-center h-5 px-1.5 text-[10px] font-medium text-blue-700 dark:text-blue-400 bg-blue-500/12 rounded-sm">
    //           DRAFT v{workflowContext.versionNumber}
    //         </span>
    //       );
    //     } else if (workflowContext.versionStatus === 'ACTIVE') {
    //       return (
    //         <span className="inline-flex items-center h-5 px-1.5 text-[10px] font-medium text-green-700 dark:text-green-400 bg-green-500/12 rounded-sm">
    //           ACTIVE v{workflowContext.versionNumber}
    //         </span>
    //       );
    //     } else if (workflowContext.versionNumber === 0) {
    //       return (
    //         <span className="inline-flex items-center h-5 px-1.5 text-[10px] font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-200/50 dark:bg-neutral-700/50 rounded-sm">
    //           New Workflow
    //         </span>
    //       );
    //     }
    //     return null;
    //   };

    return (
        <div className="flex items-center justify-between h-14 px-4 border-b border-border bg-background">
            <div className="flex items-center gap-2">
                <EditorBreadcrum workflowId={workflowId} />
                {isDirty && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-medium text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 border-amber-200 dark:border-amber-800">
                        Unsaved
                    </Badge>
                )}
            </div>

            <TooltipProvider>
                <div className="flex items-center gap-1">
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
                    <AppTooltip content={getValidationTooltip()}>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={handleValidate}
                            className="h-8 w-8"
                        >
                            {getValidationIcon() || <Check className="w-4 h-4" />}
                        </Button>
                    </AppTooltip>

                    {/* Version History Toggle */}
                    {/* {onToggleVersionHistory && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onToggleVersionHistory}
                  className={`h-6 w-6 flex items-center justify-center rounded-sm transition-colors ${
                    showVersionHistory 
                      ? 'bg-neutral-100 dark:bg-neutral-800' 
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">
                Version history
              </TooltipContent>
            </Tooltip>
          )} */}

                    {/* Save */}
                    <AppTooltip content={isSaving ? 'Saving...' : isDirty ? 'Save changes' : 'No changes'}>
                        <Button
                            variant={isDirty ? "default" : "ghost"}
                            size="icon-sm"
                            onClick={handleSave}
                            disabled={!isDirty || isSaving}
                            className={`h-8 w-8 ${!isDirty ? "opacity-50" : ""}`}
                        >
                            <Save className="w-4 h-4" />
                        </Button>
                    </AppTooltip>

                    {/* Test Run */}
                    <AppTooltip content={isTestRunning ? 'Starting...' : !workflowContext?.versionId ? 'Save first' : 'Test run'}>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={handleTestRun}
                            disabled={isTestRunning || !workflowContext?.versionId}
                            className="h-8 w-8"
                        >
                            <Play className="w-4 h-4" />
                        </Button>
                    </AppTooltip>

                    {/* Publish Toggle Switch - Only show for draft versions */}
                    {workflowContext?.versionStatus === 'DRAFT' && (
                        <div className="flex items-center gap-2 pl-2 ml-2 border-l border-border">
                            <span className="text-xs text-muted-foreground">Publish</span>
                            <AppTooltip content={isPublishing ? 'Publishing...' : isDirty ? 'Save changes first' : 'Click to publish draft'}>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handlePublishClick}
                                    disabled={isPublishing || isDirty}
                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors p-0 hover:bg-transparent ${isPublishing || isDirty
                                        ? 'opacity-50 cursor-not-allowed bg-muted'
                                        : 'bg-muted hover:bg-muted/80'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-background shadow-sm transition-transform ml-0.5 ${false ? 'translate-x-5' : 'translate-x-0'
                                            }`}
                                    />
                                </Button>
                            </AppTooltip>
                        </div>
                    )}
                </div>
            </TooltipProvider>

            {/* Publish Confirmation Dialog */}
            <AlertDialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Publish Draft Version?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will promote draft version {workflowContext?.versionNumber} to be the active version.
                            {workflowContext?.isActiveVersion === false && (
                                <> The current active version will be archived.</>
                            )}
                            <br /><br />
                            <strong>This action will affect production workflow executions.</strong>
                            <br /><br />
                            Are you sure you want to continue?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handlePublishConfirm}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            Publish Version
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}