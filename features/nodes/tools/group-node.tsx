"use client"
import { NodeResizer } from '@xyflow/react';
import { memo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useSetAtom } from 'jotai';
import { updateNodeAtom } from '@/features/editor/store';

const GroupNode = ({ id, selected, style }: { id: string, selected?: boolean, style?: React.CSSProperties }) => {
    const updateNode = useSetAtom(updateNodeAtom);

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
                    "rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 p-4 transition-all duration-200 w-full h-full",
                    selected ? "border-primary/50 bg-primary/10" : "hover:border-primary/30"
                )}
            >
                <div className="text-[10px] uppercase font-bold text-primary/50 tracking-widest select-none">
                    Group
                </div>
            </div>
        </>
    );
};

export default memo(GroupNode);
