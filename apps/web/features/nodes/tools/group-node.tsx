"use client"
import { NodeResizer } from '@xyflow/react';
import { memo, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import { useSetAtom, useAtomValue } from 'jotai';
import { updateNodeAtom, nodesAtom, deleteNodeAtom } from '@/features/editor/store';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { MoreHorizontal, Ungroup, Pencil } from 'lucide-react';

const GroupNode = ({ id, selected, style, data }: { id: string, selected?: boolean, style?: React.CSSProperties, data: { label?: string } }) => {
    const updateNode = useSetAtom(updateNodeAtom);
    const deleteNode = useSetAtom(deleteNodeAtom);
    const nodes = useAtomValue(nodesAtom);
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [newName, setNewName] = useState(data.label || "Group");

    const handleResize = useCallback((event: unknown, params: { width: number, height: number }) => {
        updateNode({
            id,
            updates: {
                style: {
                    ...style,
                    width: params.width,
                    height: params.height,
                },
            },
        });
    }, [id, updateNode, style]);

    const handleUngroup = useCallback(() => {
        const groupNode = nodes.find(n => n.id === id);
        if (!groupNode) return;

        const children = nodes.filter(n => n.parentId === id);

        children.forEach(child => {
            updateNode({
                id: child.id,
                updates: {
                    parentId: undefined,
                    extent: undefined,
                    position: {
                        x: child.position.x + groupNode.position.x,
                        y: child.position.y + groupNode.position.y,
                    }
                }
            });
        });

        deleteNode(id);
    }, [id, nodes, updateNode, deleteNode]);

    const handleRenameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateNode({
            id,
            updates: {
                data: {
                    ...data,
                    label: newName,
                }
            }
        });
        setIsRenameOpen(false);
    };

    return (
        <>
            <NodeResizer
                isVisible={selected}
                minWidth={100}
                minHeight={100}
                lineStyle={{ border: '1px solid var(--primary)', opacity: 0.5 }}
                handleStyle={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--primary)', border: '2px solid var(--background)' }}
                onResizeEnd={handleResize}
            />
            <div
                style={style}
                className={cn(
                    "rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 p-4 transition-all duration-200 w-full h-full relative group",
                    selected ? "border-primary/50 bg-primary/10" : "hover:border-primary/30"
                )}
            >
                <div className="flex items-center justify-between">
                    <div className="text-[10px] uppercase font-bold text-primary/50 tracking-widest select-none truncate max-w-[80%]" title={data.label || "Group"}>
                        {data.label || "Group"}
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded-md hover:bg-primary/10 text-primary/50 hover:text-primary transition-colors opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100">
                                <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setIsRenameOpen(true)} className="gap-2">
                                <Pencil className="w-4 h-4" />
                                Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleUngroup} className="gap-2">
                                <Ungroup className="w-4 h-4" />
                                Ungroup
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Rename Group</DialogTitle>
                        <DialogDescription>
                            Enter a new name for this group.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleRenameSubmit} className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="col-span-3"
                                autoFocus
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit">Save changes</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default memo(GroupNode);
